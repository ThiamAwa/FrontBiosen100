import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TypeCategorieService, PaginatedResponse } from '../../../services/type-categorie/type-categorie.service';
import { TypeCategorie } from '../../../models/type-categorie';

@Component({
  selector: 'app-type-categorie',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './type-categorie.component.html',
  styleUrls: ['./type-categorie.component.css']
})
export class TypeCategorieComponent implements OnInit {
  // Données et pagination
  typeCategories: TypeCategorie[] = [];
  currentPage = 1;
  lastPage = 1;
  total = 0;
  firstItem = 0;
  lastItem = 0;

  // États des modals
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedTypeCategorie: TypeCategorie | null = null;

  // Formulaires
  createForm = { nom: '' };
  editForm = { nom: '' };
  deleteForm = { id: 0, nom: '' };

  // Messages
  successMessage: string | null = null;
  errorMessage: string | null = null;
  validationErrors: string[] = [];

  // Pour l'avertissement de suppression
  hasCategories = false;

  constructor(private typeCategorieService: TypeCategorieService) { }

  ngOnInit(): void {
    this.loadTypeCategories();
  }

  loadTypeCategories(page: number = 1): void {
    this.typeCategorieService.getTypeCategories(page).subscribe({
      next: (response: PaginatedResponse<TypeCategorie>) => {
        this.typeCategories = response.data;
        this.currentPage = response.current_page;
        this.lastPage = response.last_page;
        this.total = response.total;
        this.firstItem = response.from || 0;
        this.lastItem = response.to || 0;
      },
      error: (err) => {
        console.error('Erreur de chargement', err);
        this.errorMessage = 'Impossible de charger les données.';
      }
    });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.lastPage) {
      this.loadTypeCategories(page);
    }
  }

  // Création
  openCreateModal(): void {
    this.createForm = { nom: '' };
    this.validationErrors = [];
    this.errorMessage = null;
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  createTypeCategorie(): void {
    this.typeCategorieService.createTypeCategorie(this.createForm).subscribe({
      next: () => {
        this.successMessage = 'Type de catégorie créé avec succès.';
        this.closeCreateModal();
        this.loadTypeCategories(this.currentPage);
      },
      error: (err) => {
        if (err.status === 422 && err.error?.errors) {
          // Transformer en tableau de strings
          this.validationErrors = Object.values(err.error.errors).flat() as string[];
        } else {
          this.errorMessage = err.error?.message || 'Erreur lors de la création.';
        }
      }
    });
  }

  // Édition
  openEditModal(type: TypeCategorie): void {
    this.selectedTypeCategorie = type;
    this.editForm = { nom: type.nom };
    this.validationErrors = [];
    this.errorMessage = null;
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedTypeCategorie = null;
  }

  updateTypeCategorie(): void {
    if (!this.selectedTypeCategorie) return;
    this.typeCategorieService.updateTypeCategorie(this.selectedTypeCategorie.id, this.editForm).subscribe({
      next: () => {
        this.successMessage = 'Type de catégorie modifié avec succès.';
        this.closeEditModal();
        this.loadTypeCategories(this.currentPage);
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
  openDeleteModal(type: TypeCategorie): void {
    this.selectedTypeCategorie = type;
    this.deleteForm = { id: type.id, nom: type.nom };
    // Vérifier si des catégories sont associées
    this.hasCategories = (type.categories?.length ?? type.categories_count ?? 0) > 0;
    this.errorMessage = null;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedTypeCategorie = null;
  }

  deleteTypeCategorie(): void {
    if (!this.selectedTypeCategorie) return;
    this.typeCategorieService.deleteTypeCategorie(this.selectedTypeCategorie.id).subscribe({
      next: (res) => {
        this.successMessage = res.message || 'Type de catégorie supprimé.';
        this.closeDeleteModal();
        this.loadTypeCategories(this.currentPage);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors de la suppression.';
      }
    });
  }

  // Fermer les alertes
  closeAlert(): void {
    this.successMessage = null;
    this.errorMessage = null;
  }
}