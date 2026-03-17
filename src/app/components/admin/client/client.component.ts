import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ClientService } from '../../../services/client/client.service';
import {
  Client,
  ClientCommande,
  ClientCommandeProduit,
  ClientResponse,
  ClientStats
} from '../../../models/client';

@Component({
  selector: 'app-client',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.css']
})
export class ClientComponent implements OnInit {

  // ─── Liste & Pagination ───────────────────────────────────────────────────
  clients: Client[] = [];
  currentPage = 1;
  lastPage = 1;
  total = 0;
  firstItem = 0;
  lastItem = 0;

  // ─── États des modales ────────────────────────────────────────────────────
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showViewModal = false;
  showCommandeModal = false;

  selectedClient: Client | null = null;
  clientToDelete: Client | null = null;
  clientToView: Client | null = null;
  commandeDetail: Client | null = null;
  derniereCommande: ClientCommande | null = null;

  // ─── Filtres & Recherche ──────────────────────────────────────────────────
  searchQuery = '';
  filterStatut = '';
  filterTri = '';

  // ─── Statistiques (vue détail) ────────────────────────────────────────────
  clientStats: ClientStats | null = null;

  // ─── Commande sélectionnée dans le détail ─────────────────────────────────
  selectedCommande: ClientCommande | null = null;

  // ─── Formulaires ──────────────────────────────────────────────────────────
  createForm = {
    nom: '', prenom: '', email: '',
    telephone: '', adresse: '', password: ''
  };

  editForm = {
    id: 0,
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    role_id: '',
    password: '',
  };

  // ─── Messages ─────────────────────────────────────────────────────────────
  successMessage: string | null = null;
  errorMessage: string | null = null;
  validationErrors: string[] = [];

  constructor(private clientService: ClientService) { }

  ngOnInit(): void {
    this.loadClients();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CHARGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  loadClients(page: number = this.currentPage): void {
    this.clientService.getClients(page, this.searchQuery, this.filterStatut, this.filterTri)
      .subscribe({
        next: (res: ClientResponse) => {
          this.clients = res.data.map(client => ({
            ...client,
            commandes_sum_montant_total:
              client.commandes_sum_montant_total
              ?? (client as any).commandes_sum_montantTotal
              ?? 0,
            derniere_commande:
              client.derniere_commande
              ?? client.commandes_max_created_at
              ?? undefined,
          }));
          this.currentPage = res.current_page;
          this.lastPage = res.last_page;
          this.total = res.total;
          this.firstItem = res.from ?? 0;
          this.lastItem = res.to ?? 0;
        },
        error: () => { this.errorMessage = 'Impossible de charger les clients.'; }
      });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.lastPage) this.loadClients(page);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RECHERCHE & FILTRES
  // ═══════════════════════════════════════════════════════════════════════════

  onSearch(): void { this.currentPage = 1; this.loadClients(1); }
  onFilter(): void { this.currentPage = 1; this.loadClients(1); }

  resetFilters(): void {
    this.searchQuery = '';
    this.filterStatut = '';
    this.filterTri = '';
    this.currentPage = 1;
    this.loadClients(1);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CRÉATION
  // ═══════════════════════════════════════════════════════════════════════════

  openCreateModal(): void {
    this.createForm = { nom: '', prenom: '', email: '', telephone: '', adresse: '', password: '' };
    this.validationErrors = [];
    this.errorMessage = null;
    this.showCreateModal = true;
  }

  closeCreateModal(): void { this.showCreateModal = false; }

  createClient(): void {
    this.clientService.createClient(this.createForm).subscribe({
      next: () => {
        this.successMessage = 'Client créé avec succès.';
        this.closeCreateModal();
        this.loadClients(this.currentPage);
      },
      error: (err) => {
        if (err.status === 422 && err.error?.errors) {
          this.validationErrors = Object.values(err.error.errors).flat() as string[];
        } else {
          this.errorMessage = err.error?.message || 'Erreur lors de la création.';
        }
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉDITION
  // ═══════════════════════════════════════════════════════════════════════════

  openEditModal(client: Client): void {
    this.selectedClient = client;
    this.editForm = {
      id: client.id,
      nom: client.nom,
      prenom: client.prenom,
      email: client.email,
      telephone: client.telephone,
      adresse: client.adresse || '',
      role_id: client.role_id?.toString() || '',
      password: '',
    };
    this.validationErrors = [];
    this.errorMessage = null;
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedClient = null;
  }

  updateClient(): void {
    if (!this.selectedClient) return;
    const { password, ...rest } = this.editForm;
    const data: Partial<Client> = {
      ...rest,
      role_id: rest.role_id ? +rest.role_id : undefined,
    };
    this.clientService.updateClient(this.editForm.id, data).subscribe({
      next: () => {
        this.successMessage = 'Client modifié avec succès.';
        this.closeEditModal();
        this.loadClients(this.currentPage);
      },
      error: (err) => {
        if (err.status === 422 && err.error?.errors) {
          this.validationErrors = Object.values(err.error.errors).flat() as string[];
        } else {
          this.errorMessage = err.error?.message || 'Erreur lors de la modification.';
        }
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUPPRESSION
  // ═══════════════════════════════════════════════════════════════════════════

  openDeleteModal(client: Client): void {
    this.clientToDelete = client;
    this.errorMessage = null;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.clientToDelete = null;
  }

  deleteClient(): void {
    if (!this.clientToDelete) return;
    this.clientService.deleteClient(this.clientToDelete.id).subscribe({
      next: (res) => {
        this.successMessage = res.message || 'Client supprimé.';
        this.closeDeleteModal();
        this.loadClients(this.currentPage);
      },
      error: (err) => { this.errorMessage = err.error?.message || 'Erreur lors de la suppression.'; }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUT
  // ═══════════════════════════════════════════════════════════════════════════

  toggleStatut(client: Client): void {
    const nouveauStatut: 'actif' | 'suspendu' = client.statut === 'actif' ? 'suspendu' : 'actif';
    this.clientService.updateStatut(client.id, nouveauStatut).subscribe({
      next: () => {
        client.statut = nouveauStatut;
        this.successMessage = nouveauStatut === 'actif'
          ? 'Client activé avec succès.'
          : 'Client suspendu avec succès.';
      },
      error: (err) => { this.errorMessage = err.error?.message || 'Erreur changement de statut.'; }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VUE DÉTAILS CLIENT
  // ═══════════════════════════════════════════════════════════════════════════

  openViewModal(client: Client): void {
    this.clientToView = client;
    this.clientStats = null;
    this.selectedCommande = null;

    this.clientService.getStats(client.id).subscribe({
      next: (stats: ClientStats) => {
        this.clientStats = stats;
        // ✅ Pré-sélectionner automatiquement la dernière commande
        if (stats.dernieres_commandes && stats.dernieres_commandes.length > 0) {
          this.selectedCommande = stats.dernieres_commandes[0];
        }
      },
      error: (err) => console.error('Erreur stats', err)
    });
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.clientToView = null;
    this.clientStats = null;
    this.selectedCommande = null;
  }

  /** Sélectionner une commande dans la liste pour voir son détail */
  selectCommande(commande: ClientCommande): void {
    this.selectedCommande = this.selectedCommande?.id === commande.id ? null : commande;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MODAL DERNIÈRE COMMANDE (depuis le tableau liste)
  // ═══════════════════════════════════════════════════════════════════════════

  openCommandeModal(client: Client): void {
    this.commandeDetail = { ...client };
    this.derniereCommande = null;
    this.showCommandeModal = true;

    this.clientService.getStats(client.id).subscribe({
      next: (stats: ClientStats) => {
        if (stats.dernieres_commandes && stats.dernieres_commandes.length > 0) {
          this.derniereCommande = stats.dernieres_commandes[0];
          // Mise à jour locale si derniere_commande était absente
          const idx = this.clients.findIndex(c => c.id === client.id);
          if (idx !== -1 && !this.clients[idx].derniere_commande) {
            this.clients[idx] = {
              ...this.clients[idx],
              derniere_commande: this.derniereCommande!.date
            };
          }
        }
      },
      error: (err) => console.error('Erreur stats commande', err)
    });
  }

  closeCommandeModal(): void {
    this.showCommandeModal = false;
    this.commandeDetail = null;
    this.derniereCommande = null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS PRODUITS
  // ═══════════════════════════════════════════════════════════════════════════

  getProduits(commande: ClientCommande): ClientCommandeProduit[] {
    if (!commande.produits || commande.produits.length === 0) return [];
    return commande.produits.map(p => ({
      nom: p.nom,
      quantite: Number(p.quantite),
      prix: Number(p.prix_unitaire ?? p.prix ?? p.price ?? 0),
      prix_unitaire: Number(p.prix_unitaire ?? p.prix ?? p.price ?? 0),
      type: p.type,
      image: p.image,
    }));
  }

  getPrixProduit(p: ClientCommandeProduit): number {
    return Number(p.prix_unitaire ?? p.prix ?? p.price ?? 0);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS STATUTS
  // ═══════════════════════════════════════════════════════════════════════════

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'valider': return 'statut-valider';
      case 'en_cours': return 'statut-en_cours';
      case 'en_attente': return 'statut-en_attente';
      case 'annuler': return 'statut-annuler';
      default: return 'statut-secondary';
    }
  }

  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'valider': return 'Validée';
      case 'en_cours': return 'En cours';
      case 'en_attente': return 'En attente';
      case 'annuler': return 'Annulée';
      default: return statut;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS AFFICHAGE
  // ═══════════════════════════════════════════════════════════════════════════

  getInitials(client: Client): string {
    return (client.prenom.charAt(0) + client.nom.charAt(0)).toUpperCase();
  }

  formatDate(date?: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  formatDateTime(date?: string): string {
    if (!date) return '';
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  closeAlert(): void {
    this.successMessage = null;
    this.errorMessage = null;
  }
}