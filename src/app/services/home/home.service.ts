import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AccueilData } from '../../models/accueilData';
import { Produit } from '../../models/produit';
import { Gamme } from '../../models/gamme';
import { Categorie } from '../../models/categorie';

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private apiUrl = environment.apiUrl;
  private storageUrl = environment.storageUrl;

  /**
   * Image de fallback en SVG encodé en base64.
   * Aucun fichier externe requis — fonctionne toujours même si
   * assets/img/biosen/default-product.png est absent.
   */
  readonly DEFAULT_IMAGE = `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
      <rect width="300" height="300" fill="#e8f5e9" rx="12"/>
      <rect x="80" y="70" width="140" height="160" rx="10" fill="#c8e6c9" stroke="#287747" stroke-width="2"/>
      <circle cx="150" cy="100" r="25" fill="#287747" opacity="0.3"/>
      <path d="M138 100 Q150 80 162 100 Q150 115 138 100Z" fill="#287747"/>
      <rect x="110" y="140" width="80" height="8" rx="4" fill="#287747" opacity="0.4"/>
      <rect x="120" y="158" width="60" height="6" rx="3" fill="#287747" opacity="0.3"/>
      <rect x="115" y="174" width="70" height="6" rx="3" fill="#287747" opacity="0.3"/>
      <text x="150" y="255" text-anchor="middle" font-family="Arial, sans-serif"
        font-size="13" fill="#287747" font-weight="600">Produit BioSen</text>
    </svg>
  `)}`;

  constructor(private http: HttpClient) { }

  getAccueilData(): Observable<AccueilData> {
    return this.http.get<AccueilData>(`${this.apiUrl}/accueil`);
  }

  searchProduits(query: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/accueil/search`, { params: { q: query } });
  }

  filterByCategorie(categorieId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/accueil/categorie/${categorieId}`);
  }

  filterByGamme(gammeId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/accueil/gamme/${gammeId}`);
  }

  filterByTypeCategorie(typeNom: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/produits-sport/type-categorie/${typeNom}`);
  }

  /**
   * ✅ CORRECTION COMPLÈTE de getImageUrl :
   * - Accepte `any` pour éviter le crash TypeError: .startsWith is not a function
   * - Gère : null, undefined, tableau, objet, string vide
   * - Fallback = SVG inline (aucun fichier externe requis, plus de 404)
   */
  getImageUrl(imagePath?: any): string {
    // null / undefined / falsy
    if (!imagePath) {
      return this.DEFAULT_IMAGE;
    }

    // Tableau (ex: imageUrls d'un produit sport passé par erreur)
    if (Array.isArray(imagePath)) {
      const first = imagePath[0];
      return first && typeof first === 'string'
        ? this.getImageUrl(first)
        : this.DEFAULT_IMAGE;
    }

    // Pas une string (objet, number, boolean...)
    if (typeof imagePath !== 'string') {
      return this.DEFAULT_IMAGE;
    }

    // String vide
    if (imagePath.trim() === '') {
      return this.DEFAULT_IMAGE;
    }

    // URL absolue → retourner telle quelle
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // URL relative → construire l'URL complète vers le storage Laravel
    return `${this.storageUrl}/${imagePath.replace('storage/', '')}`;
  }

  formatPrice(price?: number): string {
    if (!price) return 'Sur demande';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price).replace('XOF', 'FCFA');
  }

  calculateDiscount(original?: number, promo?: number): number {
    if (!original || !promo || original <= 0) return 0;
    return Math.round(((original - promo) / original) * 100);
  }

  limitText(text?: string, limit: number = 60): string {
    if (!text) return '';
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  }
}