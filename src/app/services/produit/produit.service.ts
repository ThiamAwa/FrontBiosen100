import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Produit } from '../../models/produit';
import { environment } from '../../../environments/environment';

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: { url: string | null; label: string; active: boolean }[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class ProduitService {
  private apiUrl = `${environment.apiUrl}/produits`;

  constructor(private http: HttpClient) { }

  // Récupération paginée avec recherche
  getAll(page: number = 1, search: string = ''): Observable<PaginatedResponse<Produit>> {
    let params = new HttpParams().set('page', page);
    if (search) params = params.set('search', search);
    return this.http.get<PaginatedResponse<Produit>>(this.apiUrl, { params });
  }

  // Récupération d'un produit par ID (avec relations)
  getById(id: number): Observable<Produit> {
    return this.http.get<Produit>(`${this.apiUrl}/${id}`);
  }

  // Création (FormData pour image)
  create(formData: FormData): Observable<Produit> {
    return this.http.post<Produit>(this.apiUrl, formData);
  }

  // Mise à jour (FormData + _method=PUT)
  update(id: number, formData: FormData): Observable<Produit> {
    formData.append('_method', 'PUT');
    return this.http.post<Produit>(`${this.apiUrl}/${id}`, formData);
  }

  // Suppression
  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  // Helper pour construire le FormData à partir d'un objet partiel et des fichiers
  buildFormData(
    produit: Partial<Produit>,
    gammesIds: number[] = [],
    imageFile?: File
  ): FormData {
    const fd = new FormData();

    if (produit.nom) fd.append('nom', produit.nom);
    if (produit.description) fd.append('description', produit.description);
    if (produit.modeUtilisation) fd.append('modeUtilisation', produit.modeUtilisation);
    if (produit.prix !== undefined) fd.append('prix', String(produit.prix));
    if (produit.stock !== undefined) fd.append('stock', String(produit.stock));
    if (produit.prixPromo !== undefined && produit.prixPromo !== null)
      fd.append('prixPromo', String(produit.prixPromo));
    fd.append('enPromotion', produit.enPromotion ? '1' : '0');
    if (produit.noteProduit !== undefined && produit.noteProduit !== null)
      fd.append('noteProduit', String(produit.noteProduit));
    if (produit.categorie_id) fd.append('categorie_id', String(produit.categorie_id));

    // Ajout des gammes (tableau)
    gammesIds.forEach(id => fd.append('gammes[]', String(id)));

    if (imageFile) fd.append('image', imageFile);

    return fd;
  }
}
