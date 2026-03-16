import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardStats } from '../../../services/dashboard/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  stats: DashboardStats | null = null;
  loading = true;
  error: string | null = null;

  constructor(private dashboardService: DashboardService) { }

  ngOnInit(): void {
    this.loadDashboard();
  }

  // ──────────────────────────────────────────
  // Chargement des données
  // ──────────────────────────────────────────
  loadDashboard(): void {
    this.loading = true;
    this.error = null;

    this.dashboardService.getDashboardData().subscribe({
      next: (data: DashboardStats) => {
        this.stats = data;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Erreur lors du chargement du tableau de bord.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  // ──────────────────────────────────────────
  // Formatage monétaire
  // ──────────────────────────────────────────
  formatCurrency(value: number): string {
    if (!value && value !== 0) return '— FCFA';
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
  }

  // ──────────────────────────────────────────
  // Statuts commandes
  // ──────────────────────────────────────────
  getStatutClass(statut: string): string {
    switch (statut) {
      case 'en_attente': return 'badge-warning';
      case 'en_cours': return 'badge-info';
      case 'valider': return 'badge-success';
      default: return 'badge-secondary';
    }
  }

  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'en_attente': return 'En attente';
      case 'en_cours': return 'En cours';
      case 'valider': return 'Validée';
      default: return statut;
    }
  }

  getStatusColor(statut: string): string {
    switch (statut) {
      case 'en_attente': return '#d97706';
      case 'en_cours': return '#0284c7';
      case 'valider': return '#16a34a';
      default: return '#6b7280';
    }
  }

  // ──────────────────────────────────────────
  // Graphique ventes
  // ──────────────────────────────────────────
  getMaxVente(): number {
    if (!this.stats?.ventes_mensuelles?.length) return 1;
    const max = Math.max(...this.stats.ventes_mensuelles.map(v => v.montant ?? 0));
    return max > 0 ? max : 1;
  }
}