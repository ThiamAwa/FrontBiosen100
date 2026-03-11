import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Vendeur, Role, Boutique } from '../../models/vendeur';

export interface VendeurResponse {
  vendeurs: {
    data: Vendeur[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  roles: Role[];
  boutiques: Boutique[];
}

@Injectable({
  providedIn: 'root'
})
export class VendeurService {
  private apiUrl = `${environment.apiUrl}/vendeurs`;

  constructor(private http: HttpClient) { }

  /**
   * Récupère la liste paginée des vendeurs.
   * @param page Numéro de la page (défaut = 1)
   */
  getVendeurs(page: number = 1): Observable<VendeurResponse> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<VendeurResponse>(this.apiUrl, { params });
  }

  /**
   * Récupère un vendeur par son ID.
   * @param id ID du vendeur
   */
  getVendeur(id: number): Observable<Vendeur> {
    return this.http.get<Vendeur>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crée un nouveau vendeur.
   * @param data Données du formulaire (nom, prénom, email, téléphone, adresse, password, role_id, boutique_id)
   */
  createVendeur(data: any): Observable<Vendeur> {
    return this.http.post<Vendeur>(this.apiUrl, data);
  }

  /**
   * Met à jour un vendeur existant.
   * @param id ID du vendeur
   * @param data Données mises à jour (les mêmes que pour la création, password optionnel)
   */
  updateVendeur(id: number, data: any): Observable<Vendeur> {
    return this.http.put<Vendeur>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Change le rôle d'un vendeur (endpoint PATCH spécifique).
   * @param id ID du vendeur
   * @param roleId Nouvel ID du rôle
   */
  changeRole(id: number, roleId: number): Observable<{ message: string; user: Vendeur }> {
    return this.http.patch<{ message: string; user: Vendeur }>(
      `${this.apiUrl}/${id}/change-role`,
      { role_id: roleId }
    );
  }

  /**
   * Supprime un vendeur.
   * @param id ID du vendeur
   */
  deleteVendeur(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
