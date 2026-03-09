// src/app/services/accueil/home.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {AccueilData} from '../../models/accueilData';
import { Produit } from '../../models/produit';
import {Gamme} from '../../models/gamme';
import {Categorie} from '../../models/categorie';

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private apiUrl = environment.apiUrl;
  private storageUrl = environment.storageUrl;

  constructor(private http: HttpClient) {}

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

  getImageUrl(imagePath?: string): string {
    if (!imagePath) return 'assets/img/biosen/default-product.png';
    if (imagePath.startsWith('http')) return imagePath;
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
