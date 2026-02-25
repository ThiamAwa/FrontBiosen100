import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProduitSport, ProduitSportResponse, ProduitMedia } from '../../models/produit-sport.model';

@Injectable({
  providedIn: 'root'
})
export class ProduitSportService {
  private apiUrl = environment.apiUrl;
  private storageUrl = environment.storageUrl;

  constructor(private http: HttpClient) {}

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
        categories: response.categories
      }))
    );
  }

  getProduit(id: number): Observable<ProduitSport> {
    return this.http.get<any>(`${this.apiUrl}/produits-sport/${id}`).pipe(
      map(produit => this.normalizeProduit(produit))
    );
  }

  getMedias(id: number): Observable<{produit: any, medias: ProduitMedia[]}> {
    return this.http.get<any>(`${this.apiUrl}/produits-sport/${id}/medias`);
  }

  // Normaliser un produit pour s'assurer que tous les champs sont présents
  private normalizeProduit(produit: any): ProduitSport {
    // S'assurer que les médias ont les bonnes propriétés
    if (produit.medias) {
      produit.medias = produit.medias.map((media: any) => ({
        ...media,
        // Si url n'est pas fournie mais chemin oui, on la construit
        url: media.url || (media.chemin ? this.getImageUrl(media.chemin) : null)
      }));
    }
    return produit as ProduitSport;
  }

  // Pour les URLs d'images (utile si Laravel ne fournit pas url)
  getImageUrl(chemin: string): string {
    if (!chemin) return 'assets/images/placeholder.jpg';
    if (chemin.startsWith('http')) return chemin;
    return `${this.storageUrl}/${chemin.replace('storage/', '')}`;
  }

  // Pour obtenir l'URL d'embed YouTube
  getEmbedUrl(url: string): string | null {
    if (!url) return null;

    // Déjà en format embed
    if (url.includes('/embed/') || url.includes('player.vimeo.com')) return url;

    // YouTube watch?v=
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

    return null;
  }

  // Obtenir la vignette YouTube
  getYouTubeThumbnail(url: string): string | null {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    return ytMatch ? `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg` : null;
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

  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/categories`);
  }


}
