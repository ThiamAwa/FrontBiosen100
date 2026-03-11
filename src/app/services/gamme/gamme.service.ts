import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Gamme } from '../../models/gamme';
import { environment } from '../../../environments/environment';
import {PaginatedResponse} from '../produit/produit.service';

export interface TypeCategorie {
  id: number;
  nom: string;
}

export interface GammePagination {
  data: Gamme[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

// ===== NOUVELLES INTERFACES POUR LA BOUTIQUE =====
export interface Categorie {
  id: number;
  nom: string;
  type_categorie_id?: number;
}

export interface Stats {
  total_gammes: number;
  gammes_avec_produits: number;
  total_produits: number;
  produits_en_promo: number;
}

@Injectable({ providedIn: 'root' })
export class GammeService {
  private apiUrl = `${environment.apiUrl}/gammes`;
  // ===== AJOUT POUR LA BOUTIQUE =====
  private publicApiUrl = environment.apiUrl; // http://localhost:8000/api
  private storageUrl = environment.storageUrl; // http://localhost:8000/storage

  constructor(private http: HttpClient) { }

  // ========== MÉTHODES EXISTANTES (À NE PAS TOUCHER) ==========

  getAll(page: number = 1, search: string = ''): Observable<GammePagination> {
    let params = new HttpParams().set('page', page);
    if (search) params = params.set('search', search);
    return this.http.get<GammePagination>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Gamme> {
    return this.http.get<Gamme>(`${this.apiUrl}/${id}`);
  }

  create(data: FormData): Observable<Gamme> {
    return this.http.post<Gamme>(this.apiUrl, data);
  }

  update(id: number, data: FormData): Observable<Gamme> {
    data.append('_method', 'PUT');
    return this.http.post<Gamme>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  buildFormData(gamme: Partial<Gamme>, imageFile?: File, videoFile?: File): FormData {
    const fd = new FormData();
    if (gamme.nom) fd.append('nom', gamme.nom);
    if (gamme.description) fd.append('description', gamme.description);
    if (gamme.modeUtilisation) fd.append('modeUtilisation', gamme.modeUtilisation);
    if (gamme.prix !== undefined) fd.append('prix', String(gamme.prix));
    if (gamme.stock !== undefined) fd.append('stock', String(gamme.stock));
    fd.append('enPromotion', gamme.enPromotion ? '1' : '0');
    if (gamme.prixPromo) fd.append('prixPromo', String(gamme.prixPromo));
    if (gamme.type_categorie_id) fd.append('type_categorie_id', String(gamme.type_categorie_id));
    if (imageFile) fd.append('image', imageFile);
    if (videoFile) fd.append('video', videoFile);
    return fd;
  }

  // ========== NOUVELLES MÉTHODES POUR LA BOUTIQUE (À AJOUTER) ==========

  /**
   * Récupérer toutes les gammes pour la boutique avec pagination et filtres
   */
  getGammesBoutique(
    page: number = 1,
    search: string = '',
    type_categorie: string = '1',
    prix_max: number = 0,
    tri: string = 'default'
  ): Observable<GammePagination> {
    let params = new HttpParams()
      .set('page', page.toString());

    if (search) params = params.set('search', search);
    if (type_categorie) params = params.set('type_categorie', type_categorie); // 👈 Ajouter ce filtre
    if (prix_max > 0) params = params.set('prix_max', prix_max.toString());
    if (tri !== 'default') params = params.set('tri', tri);

    return this.http.get<any>(`${this.apiUrl}`, { params }).pipe(
      map(response => ({
        data: response.data.map((g: any) => this.normalizeGamme(g)),
        current_page: response.current_page,
        last_page: response.last_page,
        per_page: response.per_page,
        total: response.total,
        from: response.from,
        to: response.to
      }))
    );
  }
  /**
   * Récupérer toutes les catégories
   */
  getCategories(page: number = 1): Observable<PaginatedResponse<Categorie>> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<PaginatedResponse<Categorie>>(`${this.publicApiUrl}/categories`,{ params });
  }

  /**
   * Récupérer les statistiques pour la boutique
   */
  getStats(): Observable<Stats> {
    return this.http.get<Stats>(`${this.publicApiUrl}/stats`);
  }

  /**
   * Récupérer les gammes en promotion
   */
  getGammesPromo(): Observable<Gamme[]> {
    return this.http.get<any[]>(`${this.publicApiUrl}/gammes/promo`).pipe(
      map(gammes => gammes.map(g => this.normalizeGamme(g)))
    );
  }

  /**
   * Récupérer les gammes récentes
   */
  getGammesRecentes(limit: number = 6): Observable<Gamme[]> {
    return this.http.get<any[]>(`${this.publicApiUrl}/gammes/recentes?limit=${limit}`).pipe(
      map(gammes => gammes.map(g => this.normalizeGamme(g)))
    );
  }

  /**
   * Récupérer une gamme par son ID pour la boutique
   */
  getGammeById(id: number): Observable<Gamme> {
    return this.http.get<Gamme>(`${this.publicApiUrl}/gammes/${id}`).pipe(
      map(gamme => this.normalizeGamme(gamme))
    );
  }

  // ========== MÉTHODES UTILITAIRES ==========

  /**
   * Normaliser une gamme (ajouter l'URL complète de l'image)
   */
  private normalizeGamme(gamme: any): Gamme {
    return {
      ...gamme,
      image: gamme.image ? this.getImageUrl(gamme.image) : null
    };
  }

  /**
   * Obtenir l'URL complète de l'image
   */
  getImageUrl(imagePath?: string | null): string {
    if (!imagePath) return 'assets/img/biosen/default-product.png';
    if (imagePath.startsWith('http')) return imagePath;
    return `${this.storageUrl}/${imagePath.replace('storage/', '')}`;
  }

  /**
   * Formater le prix (ex: 15000 → 15 000 FCFA)
   */
  formatPrice(price?: number | null): string {
    if (!price) return 'Sur demande';
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  }

  /**
   * Calculer le pourcentage de réduction
   */
  calculateDiscount(original: number, promo: number): number {
    if (!original || !promo || original <= 0) return 0;
    return Math.round(((original - promo) / original) * 100);
  }

  /**
   * Limiter la longueur d'un texte
   */
  limitText(text?: string | null, limit: number = 60): string {
    if (!text) return '';
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  }
}
