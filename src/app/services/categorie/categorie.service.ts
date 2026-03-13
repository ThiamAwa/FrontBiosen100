import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Categorie } from '../../models/categorie';
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

@Injectable({
  providedIn: 'root'
})
export class CategorieService {

  private apiUrl = `${environment.apiUrl}/admin/categories`;

  constructor(private http: HttpClient) { }

  /**
   * Récupère la liste paginée des catégories.
   * @param page Numéro de la page (défaut = 1)
   */
  getCategories(page: number = 1): Observable<PaginatedResponse<Categorie>> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<PaginatedResponse<Categorie>>(this.apiUrl, { params });
  }

  /**
   * Récupère une catégorie avec ses relations (typeCategorie, gammes, produits)
   * @param id Identifiant de la catégorie
   */
  getCategorie(id: number): Observable<Categorie> {
    return this.http.get<Categorie>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crée une nouvelle catégorie.
   * @param data Données de la catégorie (nom, description optionnelle, type_categorie_id optionnel)
   */
  createCategorie(data: { nom: string; description?: string; type_categorie_id?: number }): Observable<Categorie> {
    return this.http.post<Categorie>(this.apiUrl, data);
  }

  /**
   * Met à jour une catégorie existante.
   * @param id Identifiant de la catégorie
   * @param data Nouvelles données
   */
  updateCategorie(id: number, data: { nom: string; description?: string; type_categorie_id?: number }): Observable<Categorie> {
    return this.http.put<Categorie>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Supprime une catégorie.
   * @param id Identifiant de la catégorie
   */
  deleteCategorie(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}