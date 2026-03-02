import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Commande, CommandeResponse } from '../../models/commande';

@Injectable({ providedIn: 'root' })
export class CommandeService {
  private apiUrl = `${environment.apiUrl}/admin/commandes`;
  private boutiquesUrl = `${environment.apiUrl}/admin/boutiques`;

  constructor(private http: HttpClient) { }

  /**
   * Récupère la liste paginée des commandes avec filtres optionnels.
   * @param page Numéro de page
   * @param statut Filtre par statut
   * @param search Recherche texte
   * @param month Filtre par mois (format MM)
   * @param year Filtre par année (format YYYY)
   * @param date Filtre par date exacte (format YYYY-MM-DD)
   * @param dateDebut Date de début de plage
   * @param dateFin Date de fin de plage
   * @param boutique_id Filtre par ID de boutique
   */
  getCommandes(
    page: number = 1,
    statut?: string,
    search?: string,
    month?: string,
    year?: string,
    date?: string,
    dateDebut?: string,
    dateFin?: string,
    boutique_id?: string
  ): Observable<CommandeResponse> {
    let params = new HttpParams().set('page', page);
    if (statut) params = params.set('statut', statut);
    if (search) params = params.set('search', search);
    if (month) params = params.set('month', month);
    if (year) params = params.set('year', year);
    if (date) params = params.set('date', date);
    if (dateDebut) params = params.set('date_debut', dateDebut);
    if (dateFin) params = params.set('date_fin', dateFin);
    if (boutique_id) params = params.set('boutique_id', boutique_id);
    return this.http.get<CommandeResponse>(this.apiUrl, { params });
  }

  /**
   * Récupère la liste des boutiques pour le sélecteur de filtre.
   */
  getBoutiques(): Observable<{ id: number; nom: string }[]> {
    return this.http.get<{ id: number; nom: string }[]>(this.boutiquesUrl);
  }

  /**
   * Récupère une commande par son ID.
   */
  getCommande(id: number): Observable<Commande> {
    return this.http.get<Commande>(`${this.apiUrl}/${id}`);
  }

  /**
   * Met à jour le statut et/ou la note d'une commande.
   */
  updateCommande(id: number, data: { statut: string; noteCommande?: string }): Observable<Commande> {
    return this.http.put<Commande>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Supprime une commande.
   */
  deleteCommande(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Récupère les statistiques des commandes.
   */
  getStatistics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/statistics`);
  }

  /**
   * Exporte les commandes au format CSV.
   */
  exportCSV(
    statut?: string,
    month?: string,
    year?: string,
    date?: string
  ): Observable<Blob> {
    let params = new HttpParams();
    if (statut) params = params.set('statut', statut);
    if (month) params = params.set('month', month);
    if (year) params = params.set('year', year);
    if (date) params = params.set('date', date);
    return this.http.get(`${this.apiUrl}/export`, { params, responseType: 'blob' });
  }
}