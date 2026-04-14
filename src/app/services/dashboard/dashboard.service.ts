import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ── Interfaces ──────────────────────────────────────────

export interface VenteJournaliere {
  jour: string;
  montant: number;
  nb_commandes: number;
}

export interface VenteMensuelle {
  mois: string;
  montant: number;
}

export interface RepartitionStatut {
  statut: string;
  total: number;
}

export interface DashboardStats {
  stats: {
    total_commandes: number;
    commandes_mois: number;
    commandes_jour: number;
    revenus_total: number;
    revenus_mois: number;
    revenus_jour: number;
    total_clients: number;
    clients_mois: number;
    taux_conversion: number;
  };
  stats_produits: {
    total_produits: number;
    total_gammes: number;
    total_categories: number;
    produits_stock_bas: number;
  };
  stats_personnel: {
    total_boutiques: number;
    total_vendeurs: number;
    total_commerciaux: number;
    total_responsables: number;
  };
  commandes_recentes: any[];
  repartition_statuts: RepartitionStatut[];
  ventes_mensuelles: VenteMensuelle[];
  ventes_journalieres: VenteJournaliere[];
}

// ── Service ──────────────────────────────────────────────

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getDashboardData(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard`);
  }
}