import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LivreurService } from '../../../services/livreur/livreur.service';
import { Livreur, LivreurResponse } from '../../../models/livreur';

@Component({
  selector: 'app-livreur',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './livreur.component.html',
  styleUrls: ['./livreur.component.css']
})
export class LivreurComponent implements OnInit {
  livreurs: Livreur[] = [];
  currentPage = 1;
  lastPage = 1;
  total = 0;
  firstItem = 0;
  lastItem = 0;

  // États des modals
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedLivreur: Livreur | null = null;
  livreurToDelete: Livreur | null = null;

  // Formulaires
  createForm = {
    nom: '',
    prenom: '',
    telephone: '',
    adresse: ''
  };
  editForm = {
    id: 0,
    nom: '',
    prenom: '',
    telephone: '',
    adresse: ''
  };

  // Messages
  successMessage: string | null = null;
  errorMessage: string | null = null;
  validationErrors: string[] = [];

  constructor(private livreurService: LivreurService) { }

  ngOnInit(): void {
    this.loadLivreurs();
  }

  loadLivreurs(page: number = 1): void {
    this.livreurService.getLivreurs(page).subscribe({
      next: (res: LivreurResponse) => {
        this.livreurs = res.data;
        this.currentPage = res.current_page;
        this.lastPage = res.last_page;
        this.total = res.total;
        this.firstItem = res.from || 0;
        this.lastItem = res.to || 0;
      },
      error: (err) => {
        console.error('Erreur chargement livreurs', err);
        this.errorMessage = 'Impossible de charger les livreurs.';
      }
    });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.lastPage) {
      this.loadLivreurs(page);
    }
  }

  // Création
  openCreateModal(): void {
    this.createForm = { nom: '', prenom: '', telephone: '', adresse: '' };
    this.validationErrors = [];
    this.errorMessage = null;
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  createLivreur(): void {
    this.livreurService.createLivreur(this.createForm).subscribe({
      next: () => {
        this.successMessage = 'Livreur créé avec succès.';
        this.closeCreateModal();
        this.loadLivreurs(this.currentPage);
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

  // Édition
  openEditModal(livreur: Livreur): void {
    this.selectedLivreur = livreur;
    this.editForm = {
      id: livreur.id,
      nom: livreur.nom,
      prenom: livreur.prenom,
      telephone: livreur.telephone,
      adresse: livreur.adresse
    };
    this.validationErrors = [];
    this.errorMessage = null;
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedLivreur = null;
  }

  updateLivreur(): void {
    if (!this.selectedLivreur) return;
    this.livreurService.updateLivreur(this.editForm.id, this.editForm).subscribe({
      next: () => {
        this.successMessage = 'Livreur modifié avec succès.';
        this.closeEditModal();
        this.loadLivreurs(this.currentPage);
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

  // Suppression
  openDeleteModal(livreur: Livreur): void {
    this.livreurToDelete = livreur;
    this.errorMessage = null;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.livreurToDelete = null;
  }

  deleteLivreur(): void {
    if (!this.livreurToDelete) return;
    this.livreurService.deleteLivreur(this.livreurToDelete.id).subscribe({
      next: (res) => {
        this.successMessage = res.message || 'Livreur supprimé.';
        this.closeDeleteModal();
        this.loadLivreurs(this.currentPage);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors de la suppression.';
      }
    });
  }

  closeAlert(): void {
    this.successMessage = null;
    this.errorMessage = null;
  }

  // Helper pour formater la date
  formatDate(date?: string): string {
    return date ? new Date(date).toLocaleDateString('fr-FR') : '';
  }

  // Truncate adresse
  truncate(text: string, limit: number): string {
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  }
}