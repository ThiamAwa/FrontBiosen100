import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Commande, CommandeResponse } from '../../models/commande';

@Injectable({ providedIn: 'root' })
export class CommandeService {
  private apiUrl = `${environment.apiUrl}/commandes`;
  private boutiquesUrl = `${environment.apiUrl}/boutiques`;

  constructor(private http: HttpClient) { }

  // ─── Liste paginée avec filtres ───────────────────────────────────────────

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

    let params = new HttpParams().set('page', page.toString());

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

  // ─── Boutiques (pour le sélecteur de filtre) ──────────────────────────────

  getBoutiques(): Observable<{ id: number; nom: string }[]> {
    return this.http.get<{ id: number; nom: string }[]>(this.boutiquesUrl);
  }

  // ─── Détail d'une commande ────────────────────────────────────────────────

  getCommande(id: number): Observable<Commande> {
    return this.http.get<Commande>(`${this.apiUrl}/${id}`);
  }

  // ─── Mise à jour statut / note ────────────────────────────────────────────

  updateCommande(
    id: number,
    data: { statut: string; noteCommande?: string }
  ): Observable<Commande> {
    return this.http.put<Commande>(`${this.apiUrl}/${id}`, data);
  }

  // ─── Suppression ──────────────────────────────────────────────────────────

  deleteCommande(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  // ─── Statistiques ─────────────────────────────────────────────────────────

  getStatistics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/statistics`);
  }

  // ─── Export CSV ───────────────────────────────────────────────────────────

  exportCSV(
    statut?: string,
    month?: string,
    year?: string,
    date?: string,
    search?: string
  ): Observable<Blob> {

    let params = new HttpParams();

    if (statut) params = params.set('statut', statut);
    if (month) params = params.set('month', month);
    if (year) params = params.set('year', year);
    if (date) params = params.set('date', date);
    if (search) params = params.set('search', search);

    return this.http.get(
      `${this.apiUrl}/export/csv`,
      { params, responseType: 'blob' }
    );
  }
}
