import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProduitSport, ProduitSportResponse, ProduitMedia, Categorie } from '../../models/produit-sport';

@Injectable({
  providedIn: 'root'
})
export class ProduitSportService {
  private apiUrl = environment.apiUrl;
  private adminUrl = `${environment.apiUrl}/admin/produits-sport`; // URL pour les actions admin
  private storageUrl = environment.storageUrl;

  constructor(private http: HttpClient) { }

  // ─── PARTIE PUBLIQUE ─────────────────────────────────────────────

  getProduits(page: number = 1): Observable<ProduitSportResponse> {
    return this.http.get<any>(`${this.apiUrl}/produits-sport?page=${page}`).pipe(
      map(response => ({
        produits: {
          data: response.produits.data.map((p: any) => this.normalizeProduit(p)),
          current_page: response.produits.current_page,
          last_page: response.produits.last_page,
          per_page: response.produits.per_page,
          total: response.produits.total
        },
        typeCategories: response.typeCategories
      }))
    );
  }

  getProduit(id: number): Observable<ProduitSport> {
    return this.http.get<any>(`${this.apiUrl}/produits-sport/${id}`).pipe(
      map(produit => this.normalizeProduit(produit))
    );
  }

  getMedias(id: number): Observable<{ produit: any; medias: ProduitMedia[] }> {
    return this.http.get<any>(`${this.apiUrl}/produits-sport/${id}/medias`);
  }

  getProduitsWithFilters(params: any): Observable<any> {
    let url = `${this.apiUrl}/produits-sport?`;
    if (params.page) url += `page=${params.page}&`;
    if (params.search) url += `search=${encodeURIComponent(params.search)}&`;
    if (params.categorie) url += `categorie=${params.categorie}&`;
    if (params.prix_max) url += `prix_max=${params.prix_max}&`;
    if (params.en_promotion) url += `en_promotion=${params.en_promotion}&`;
    if (params.sort && params.sort !== 'default') url += `sort=${params.sort}&`;
    return this.http.get<any>(url).pipe(
      map(response => ({
        ...response,
        produits: {
          ...response.produits,
          data: response.produits.data.map((p: any) => this.normalizeProduit(p))
        }
      }))
    );
  }


  // ─── PARTIE ADMIN (CRUD) ─────────────────────────────────────────

  /**
   * Crée un nouveau produit sport.
   * @param formData Formulaire contenant les champs du produit, les images et les vidéos.
   */
  createProduit(formData: FormData): Observable<ProduitSport> {
    if (!formData.has('type_categorie_id')) {
      console.warn('type_categorie_id manquant dans FormData');
    }
    return this.http.post<ProduitSport>(this.adminUrl, formData).pipe(
      map(produit => this.normalizeProduit(produit))
    );
  }

  /**
   * Met à jour un produit sport existant.
   * @param id ID du produit
   * @param formData Formulaire contenant les champs modifiés, les nouvelles images/vidéos et les éventuelles suppressions.
   */
  updateProduit(id: number, formData: FormData): Observable<ProduitSport> {
    // On ajoute le champ _method pour simuler une requête PUT (nécessaire pour Laravel avec FormData)
    formData.append('_method', 'PUT');
    return this.http.post<ProduitSport>(`${this.adminUrl}/${id}`, formData).pipe(
      map(produit => this.normalizeProduit(produit))
    );
  }

  /**
   * Supprime un produit sport.
   * @param id ID du produit
   */
  deleteProduit(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.adminUrl}/${id}`);
  }

  // ─── HELPERS ─────────────────────────────────────────────────────

  private normalizeProduit(produit: any): ProduitSport {
    if (produit.medias) {
      produit.medias = produit.medias.map((media: any) => ({
        ...media,
        url: media.url || (media.chemin ? this.getImageUrl(media.chemin) : null),
        embed_url: media.type === 'video_url' && media.url_externe ? this.getEmbedUrl(media.url_externe) : null,
        youtube_thumbnail: media.type === 'video_url' && media.url_externe ? this.getYouTubeThumbnail(media.url_externe) : null
      }));
    }
    return produit as ProduitSport;
  }

  getImageUrl(chemin: string): string {
    if (!chemin) return 'assets/images/placeholder.jpg';
    if (chemin.startsWith('http')) return chemin;
    return `${this.storageUrl}/${chemin.replace('storage/', '')}`;
  }

  getEmbedUrl(url: string): string | null {
    if (!url) return null;
    if (url.includes('/embed/') || url.includes('player.vimeo.com')) return url;
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return null;
  }

  getYouTubeThumbnail(url: string): string | null {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    return ytMatch ? `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg` : null;
  }
}
