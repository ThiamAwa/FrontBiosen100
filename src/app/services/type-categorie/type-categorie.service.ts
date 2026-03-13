import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { TypeCategorie } from '../../models/type-categorie';
import { environment } from '../../../environments/environment';

// Interface pour la réponse paginée de Laravel
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

@Injectable({
  providedIn: 'root'
})
export class TypeCategorieService {
  private apiUrl = `${environment.apiUrl}/typecategories`;

  constructor(private http: HttpClient) { }



  /**
   * Récupère la liste paginée des types de catégories.
   * @param page Numéro de la page (défaut = 1)
   */
  getTypeCategories(page: number = 1): Observable<PaginatedResponse<TypeCategorie>> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<PaginatedResponse<TypeCategorie>>(this.apiUrl, { params });
  }

  /**
   * Récupère un type de catégorie avec ses relations (categories, gammes)
   * @param id Identifiant du type
   */
  getTypeCategorie(id: number): Observable<TypeCategorie> {
    return this.http.get<TypeCategorie>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crée un nouveau type de catégorie.
   * @param data Objet contenant le nom 
   */
  createTypeCategorie(data: { nom: string }): Observable<TypeCategorie> {
    return this.http.post<TypeCategorie>(this.apiUrl, data);
  }

  /**
   * Met à jour un type de catégorie existant.
   * @param id Identifiant du type
   * @param data Objet contenant le nouveau nom
   */
  updateTypeCategorie(id: number, data: { nom: string }): Observable<TypeCategorie> {
    return this.http.put<TypeCategorie>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Supprime un type de catégorie.
   * @param id Identifiant du type
   * @returns Observable contenant un message de confirmation
   */
  deleteTypeCategorie(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}