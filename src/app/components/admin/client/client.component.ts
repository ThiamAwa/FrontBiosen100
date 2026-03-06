import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ClientService } from '../../../services/client/client.service';
import { Client, ClientResponse, ClientStats } from '../../../models/client';

@Component({
  selector: 'app-client',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.css']
})
export class ClientComponent implements OnInit {
  clients: Client[] = [];
  currentPage = 1;
  lastPage = 1;
  total = 0;
  firstItem = 0;
  lastItem = 0;

  // États des modales
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showViewModal = false;
  showCommandeModal = false;

  selectedClient: Client | null = null;
  clientToDelete: Client | null = null;
  clientToView: Client | null = null;
  commandeDetail: Client | null = null;
  derniereCommande: any = null;

  // Filtres et recherche
  searchQuery: string = '';
  filterStatut: string = '';
  filterTri: string = '';

  // Statistiques (pour la vue détail)
  clientStats: ClientStats | null = null;

  // Formulaires
  createForm = {
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    password: ''
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
    email_verified: false
  };

  // Messages
  successMessage: string | null = null;
  errorMessage: string | null = null;
  validationErrors: string[] = [];

  constructor(private clientService: ClientService) { }

  ngOnInit(): void {
    this.loadClients();
  }

  // ─── Chargement ──────────────────────────────────────────────────────────────

  loadClients(page: number = this.currentPage): void {
    this.clientService.getClients(
      page,
      this.searchQuery,
      this.filterStatut,
      this.filterTri
    ).subscribe({
      next: (res: ClientResponse) => {
        this.clients = res.data;
        this.currentPage = res.current_page;
        this.lastPage = res.last_page;
        this.total = res.total;
        this.firstItem = res.from || 0;
        this.lastItem = res.to || 0;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les clients.';
      }
    });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.lastPage) {
      this.loadClients(page);
    }
  }

  // ─── Recherche & Filtres ─────────────────────────────────────────────────────

  onSearch(): void {
    this.currentPage = 1;
    this.loadClients(1);
  }

  onFilter(): void {
    this.currentPage = 1;
    this.loadClients(1);
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.filterStatut = '';
    this.filterTri = '';
    this.currentPage = 1;
    this.loadClients(1);
  }

  // ─── Création ────────────────────────────────────────────────────────────────

  openCreateModal(): void {
    this.createForm = {
      nom: '', prenom: '', email: '',
      telephone: '', adresse: '', password: ''
    };
    this.validationErrors = [];
    this.errorMessage = null;
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

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

  // ─── Édition ─────────────────────────────────────────────────────────────────

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
      email_verified: !!client.email_verified_at
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

  // ─── Suppression ─────────────────────────────────────────────────────────────

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
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors de la suppression.';
      }
    });
  }

  // ─── Statut ──────────────────────────────────────────────────────────────────

  toggleStatut(client: Client): void {
    const nouveauStatut = client.statut === 'actif' ? 'suspendu' : 'actif';
    this.clientService.updateStatut(client.id, nouveauStatut).subscribe({
      next: () => {
        client.statut = nouveauStatut;
        this.successMessage = nouveauStatut === 'actif'
          ? 'Client activé avec succès.'
          : 'Client suspendu avec succès.';
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors du changement de statut.';
      }
    });
  }

  // ─── Vue détails ─────────────────────────────────────────────────────────────

  openViewModal(client: Client): void {
    this.clientToView = client;
    this.clientStats = null;
    this.clientService.getStats(client.id).subscribe({
      next: (stats: ClientStats) => {
        this.clientStats = stats;
      },
      error: (err) => console.error('Erreur stats', err)
    });
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.clientToView = null;
    this.clientStats = null;
  }

  // ─── Dernière commande ───────────────────────────────────────────────────────

  openCommandeModal(client: Client): void {
    this.commandeDetail = { ...client };
    this.derniereCommande = null;
    this.showCommandeModal = true;
    this.clientService.getStats(client.id).subscribe({
      next: (stats: ClientStats) => {
        if (stats.dernieres_commandes?.length > 0) {
          this.derniereCommande = stats.dernieres_commandes[0];
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

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  getInitials(client: Client): string {
    return (client.prenom.charAt(0) + client.nom.charAt(0)).toUpperCase();
  }

  formatDate(date?: string): string {
    return date ? new Date(date).toLocaleDateString('fr-FR') : '';
  }

  formatDateTime(date?: string): string {
    return date ? new Date(date).toLocaleString('fr-FR') : '';
  }

  closeAlert(): void {
    this.successMessage = null;
    this.errorMessage = null;
  }
}