import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ClientService } from '../../../services/client/client.service';
import { Client, ClientResponse } from '../../../models/client';

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
  selectedClient: Client | null = null;
  clientToDelete: Client | null = null;
  clientToView: Client | null = null;

  // Filtres et recherche
  currentFilter: string = 'all';
  searchTerm: string = '';

  // Statistiques (pour la vue détail)
  clientStats: any = null;

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

  // Getters pour les compteurs
  get verifiedCount(): number {
    return this.clients.filter(c => !!c.email_verified_at).length;
  }
  get unverifiedCount(): number {
    return this.clients.filter(c => !c.email_verified_at).length;
  }

  constructor(private clientService: ClientService) { }

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(page: number = this.currentPage): void {
    this.clientService.getClients(page, this.searchTerm, this.currentFilter !== 'all' ? this.currentFilter : undefined).subscribe({
      next: (res: ClientResponse) => {
        this.clients = res.data;
        this.currentPage = res.current_page;
        this.lastPage = res.last_page;
        this.total = res.total;
        this.firstItem = res.from || 0;
        this.lastItem = res.to || 0;
      },
      error: (err) => {
        console.error('Erreur chargement clients', err);
        this.errorMessage = 'Impossible de charger les clients.';
      }
    });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.lastPage) {
      this.loadClients(page);
    }
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadClients(1);
  }

  onFilter(filter: string): void {
    this.currentFilter = filter;
    this.currentPage = 1;
    this.loadClients(1);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.onSearch();
  }

  // --- Création ---
  openCreateModal(): void {
    this.createForm = { nom: '', prenom: '', email: '', telephone: '', adresse: '', password: '' };
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

  // --- Édition ---
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
      // email_verified_at: rest.email_verified ? new Date().toISOString() : null
    };
    // if (password) {
    //   data.password = password;
    // }

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

  // --- Suppression ---
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
        if (err.status === 422 && err.error?.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = err.error?.message || 'Erreur lors de la suppression.';
        }
      }
    });
  }

  // --- Vue détails ---
  openViewModal(client: Client): void {
    this.clientToView = client;
    this.clientService.getStats(client.id).subscribe({
      next: (stats) => {
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

  // --- Helpers ---
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