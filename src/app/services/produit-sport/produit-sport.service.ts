import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

// ─── INTERFACES alignées sur la migration ────────────────────────────────────

export interface TypeCategorie {
  id: number;
  nom: string;
}

export interface ProduitSport {
  id: number;
  nom: string;
  description: string | null;
  prix: number;
  prixPromo: number | null;
  stock: number;
  enPromotion: boolean;
  noteProduit: number | null;
  ordre: number;
  type_categorie_id: number | null;
  image: string[];        // JSON array de chemins relatifs
  video: string | null;   // une seule URL vidéo
  typeCategorie?: TypeCategorie;
  created_at?: string;          // ✅ optionnel — pas toujours retourné
  updated_at?: string;

  // Champs calculés côté front (non en BDD)
  imageUrls: string[];
  embedUrl: string | null;
  thumbnail: string | null;
}

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  path?: string;
}

export interface ProduitSportResponse {
  produits: {
    data: ProduitSport[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  typeCategories: TypeCategorie[];
}

export interface MediasResponse {
  produit: { id: number; nom: string; typeCategorie: string | null };
  medias: {
    type: 'image' | 'video';
    url: string;
    path?: string; // chemin brut (images uniquement) — utile pour images_a_supprimer
  }[];
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ProduitSportService {

  private apiUrl = environment.apiUrl;
  private storageUrl = environment.storageUrl;

  constructor(private http: HttpClient) { }

  // ─── PUBLIQUE ─────────────────────────────────────────────────────────────

  getProduits(page: number = 1): Observable<ProduitSportResponse> {
    return this.http
      .get<any>(`${this.apiUrl}/produits-sport?page=${page}`)
      .pipe(map(res => this.normalizeResponse(res)));
  }

  getProduit(id: number): Observable<ProduitSport> {
    return this.http
      .get<any>(`${this.apiUrl}/produits-sport/${id}`)
      .pipe(map(p => this.normalizeProduit(p)));
  }

  getProduitsWithFilters(params: {
    page?: number;
    search?: string;
    categorie?: number;
    prix_max?: number;
    en_promotion?: boolean;
    sort?: string;
  }): Observable<ProduitSportResponse> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.search) query.set('search', params.search);
    if (params.categorie) query.set('categorie', String(params.categorie));
    if (params.prix_max) query.set('prix_max', String(params.prix_max));
    if (params.en_promotion) query.set('en_promotion', '1');
    if (params.sort && params.sort !== 'default') query.set('sort', params.sort);

    return this.http
      .get<any>(`${this.apiUrl}/produits-sport?${query.toString()}`)
      .pipe(map(res => this.normalizeResponse(res)));
  }

  // ─── MÉDIAS ───────────────────────────────────────────────────────────────

  /**
   * Retourne la liste des images (URLs publiques + chemin brut)
   * et la vidéo s'il y en a une.
   */
  getMedias(id: number): Observable<MediasResponse> {
    return this.http.get<MediasResponse>(`${this.apiUrl}/produits-sport/${id}/medias`);
  }

  // ─── ADMIN CRUD ───────────────────────────────────────────────────────────

  /**
   * Création — FormData attendu :
   *   nom, description, prix, prixPromo, stock, enPromotion,
   *   type_categorie_id, video (optionnel),
   *   images[]  (fichiers image, optionnel)
   */
  createProduit(formData: FormData): Observable<ProduitSport> {
    return this.http
      .post<any>(this.adminUrl, formData)
      .pipe(map(p => this.normalizeProduit(p)));
  }

  /**
   * Mise à jour — FormData attendu :
   *   mêmes champs que create +
   *   images_a_supprimer[]  (chemins bruts à retirer du JSON)
   *   _method = PUT  (ajouté automatiquement)
   */
  updateProduit(id: number, formData: FormData): Observable<ProduitSport> {
    formData.append('_method', 'PUT');
    return this.http
      .post<any>(`${this.adminUrl}/${id}`, formData)
      .pipe(map(p => this.normalizeProduit(p)));
  }

  deleteProduit(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/produits-sport/${id}`);
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  /** Normalise la réponse paginée */
  private normalizeResponse(res: any): ProduitSportResponse {
    return {
      produits: {
        ...res.produits,
        data: res.produits.data.map((p: any) => this.normalizeProduit(p))
      },
      typeCategories: res.typeCategories ?? []
    };
  }

  /**
   * Normalise un produit brut reçu de l'API.
   *
   * Colonnes BDD :
   *   image  → json  (string[])  — chemins relatifs
   *   video  → string|null       — URL directe YouTube / Vimeo / autre
   */
  private normalizeProduit(produit: any): ProduitSport {
    const images: string[] = Array.isArray(produit.image) ? produit.image : [];

    return {
      ...produit,
      image: images,
      imageUrls: images.map(chemin => this.getImageUrl(chemin)),
      embedUrl: produit.video ? this.getEmbedUrl(produit.video) : null,
      thumbnail: produit.video ? this.getYouTubeThumbnail(produit.video) : null,
      // ✅ Correction : on mappe la propriété 'type_categorie' (venant de l'API) vers 'typeCategorie' (attendu par le template)
      typeCategorie: produit.type_categorie,
    };
  }

  /** Construit l'URL publique d'une image stockée en local */
  getImageUrl(chemin: string): string {
    if (!chemin) return 'assets/images/placeholder.jpg';
    if (chemin.startsWith('http')) return chemin;
    return `${this.storageUrl}/${chemin.replace('storage/', '')}`;
  }

  /** Transforme une URL YouTube/Vimeo en URL embed */
  getEmbedUrl(url: string): string | null {
    if (!url) return null;
    if (url.includes('/embed/') || url.includes('player.vimeo.com')) return url;
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1`;
    const vimeo = url.match(/vimeo\.com\/(\d+)/);
    if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
    return null;
  }

  /** Retourne la miniature HQ d'une vidéo YouTube */
  getYouTubeThumbnail(url: string): string | null {
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    return yt ? `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg` : null;
  }
}
