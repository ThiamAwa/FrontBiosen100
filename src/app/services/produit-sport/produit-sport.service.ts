import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  image: string[];
  video: string | null;
  typeCategorie?: TypeCategorie;
  created_at?: string;
  updated_at?: string;
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
    path?: string;
  }[];
}

@Injectable({ providedIn: 'root' })
export class ProduitSportService {

  private apiUrl = environment.apiUrl;
  private adminUrl = `${environment.apiUrl}/admin/produits-sport`;
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

  getMedias(id: number): Observable<MediasResponse> {
    return this.http.get<MediasResponse>(`${this.apiUrl}/produits-sport/${id}/medias`);
  }

  // ─── ADMIN CRUD ───────────────────────────────────────────────────────────

  createProduit(formData: FormData): Observable<ProduitSport> {
    return this.http
      .post<any>(this.adminUrl, formData)
      .pipe(map(p => this.normalizeProduit(p)));
  }

  updateProduit(id: number, formData: FormData): Observable<ProduitSport> {
    formData.append('_method', 'PUT');
    return this.http
      .post<any>(`${this.adminUrl}/${id}`, formData)
      .pipe(map(p => this.normalizeProduit(p)));
  }

  deleteProduit(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.adminUrl}/${id}`);
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  private normalizeResponse(res: any): ProduitSportResponse {
    return {
      produits: {
        ...res.produits,
        data: res.produits.data.map((p: any) => this.normalizeProduit(p))
      },
      typeCategories: res.typeCategories ?? []
    };
  }

  private normalizeProduit(produit: any): ProduitSport {
    const images: string[] = Array.isArray(produit.image) ? produit.image : [];

    return {
      ...produit,
      image: images,
      imageUrls: images.map(chemin => this.getImageUrl(chemin)),
      embedUrl: produit.video ? this.getEmbedUrl(produit.video) : null,
      thumbnail: produit.video ? this.getYouTubeThumbnail(produit.video) : null,
      typeCategorie: produit.type_categorie,
    };
  }

  // ✅ CORRECTION — gère tous les formats de chemins possibles
  getImageUrl(chemin: string): string {
    if (!chemin) return 'assets/img/placeholder.jpeg';
    if (chemin.startsWith('http')) return chemin;

    // Nettoie le chemin : supprime storage/, public/, public/storage/
    const cleanPath = chemin
      .replace(/^public\/storage\//, '')
      .replace(/^public\//, '')
      .replace(/^storage\//, '');

    return `${this.storageUrl}/${cleanPath}`;
  }

  getEmbedUrl(url: string): string | null {
    if (!url) return null;
    if (url.includes('/embed/') || url.includes('player.vimeo.com')) return url;
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1`;
    const vimeo = url.match(/vimeo\.com\/(\d+)/);
    if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
    return null;
  }

  getYouTubeThumbnail(url: string): string | null {
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    return yt ? `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg` : null;
  }
}