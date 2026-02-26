import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategorieService, PaginatedResponse } from '../../../services/categorie/categorie.service';
import { TypeCategorieService } from '../../../services/type-categorie/type-categorie.service';
import { TypeCategorie } from '../../../models/type-categorie';

import { Categorie } from '../../../models/categorie';
@Component({
  selector: 'app-categorie',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categorie.component.html',
  styleUrls: ['./categorie.component.css']
})
export class CategorieComponent implements OnInit {
  categories: Categorie[] = [];
  typeCategories: TypeCategorie[] = [];
  currentPage = 1;
  lastPage = 1;
  total = 0;
  firstItem = 0;
  lastItem = 0;
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedCategorie: Categorie | null = null;
  createForm = { nom: '', description: '', type_categorie_id: '' };
  editForm = { nom: '', description: '', type_categorie_id: '' };
  successMessage: string | null = null;
  errorMessage: string | null = null;
  validationErrors: string[] = [];
  hasGammesOrProduits = false;

  constructor(
    private categorieService: CategorieService,
    private typeCategorieService: TypeCategorieService
  ) { }

  ngOnInit(): void {
    this.loadCategories();
    this.loadTypeCategories();
  }

  loadCategories(page: number = 1): void {
    this.categorieService.getCategories(page).subscribe({
      next: (response: PaginatedResponse<Categorie>) => {
        this.categories = response.data;
        this.currentPage = response.current_page;
        this.lastPage = response.last_page;
        this.total = response.total;
        this.firstItem = response.from || 0;
        this.lastItem = response.to || 0;
      },
      error: (err: any) => {
        console.error('Erreur de chargement', err);
        this.errorMessage = 'Impossible de charger les catégories.';
      }
    });
  }

  loadTypeCategories(): void {
    this.typeCategorieService.getTypeCategories(1).subscribe({
      next: (response: PaginatedResponse<TypeCategorie>) => {
        this.typeCategories = response.data;
      },
      error: (err) => console.error('Erreur chargement types', err)
    });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.lastPage) {
      this.loadCategories(page);
    }
  }

  openCreateModal(): void {
    this.createForm = { nom: '', description: '', type_categorie_id: '' };
    this.validationErrors = [];
    this.errorMessage = null;
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  createCategorie(): void {
    const data = {
      nom: this.createForm.nom,
      description: this.createForm.description,
      type_categorie_id: this.createForm.type_categorie_id ? +this.createForm.type_categorie_id : undefined
    };
    this.categorieService.createCategorie(data).subscribe({
      next: () => {
        this.successMessage = 'Catégorie créée avec succès.';
        this.closeCreateModal();
        this.loadCategories(this.currentPage);
      },
      error: (err: any) => {
        if (err.status === 422 && err.error?.errors) {
          this.validationErrors = Object.values(err.error.errors).flat() as string[];
        } else {
          this.errorMessage = err.error?.message || 'Erreur lors de la création.';
        }
      }
    });
  }

  openEditModal(categorie: Categorie): void {
    this.selectedCategorie = categorie;
    this.editForm = {
      nom: categorie.nom,
      description: categorie.description,
      type_categorie_id: categorie.type_categorie_id?.toString() || ''
    };
    this.validationErrors = [];
    this.errorMessage = null;
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedCategorie = null;
  }

  updateCategorie(): void {
    if (!this.selectedCategorie) return;
    const data = {
      nom: this.editForm.nom,
      description: this.editForm.description,
      type_categorie_id: this.editForm.type_categorie_id ? +this.editForm.type_categorie_id : undefined
    };
    this.categorieService.updateCategorie(this.selectedCategorie.id, data).subscribe({
      next: () => {
        this.successMessage = 'Catégorie modifiée avec succès.';
        this.closeEditModal();
        this.loadCategories(this.currentPage);
      },
      error: (err: any) => {
        if (err.status === 422 && err.error?.errors) {
          this.validationErrors = Object.values(err.error.errors).flat() as string[];
        } else {
          this.errorMessage = err.error?.message || 'Erreur lors de la modification.';
        }
      }
    });
  }

  openDeleteModal(categorie: Categorie): void {
    this.selectedCategorie = categorie;
    // this.hasGammesOrProduits = (categorie.gammes_count ?? 0) > 0 || (categorie.produits_count ?? 0) > 0;
    this.errorMessage = null;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedCategorie = null;
  }

  deleteCategorie(): void {
    if (!this.selectedCategorie) return;
    this.categorieService.deleteCategorie(this.selectedCategorie.id).subscribe({
      next: (res: { message: string }) => {
        this.successMessage = res.message || 'Catégorie supprimée.';
        this.closeDeleteModal();
        this.loadCategories(this.currentPage);
      },
      error: (err: any) => {
        this.errorMessage = err.error?.message || 'Erreur lors de la suppression.';
      }
    });
  }

  closeAlert(): void {
    this.successMessage = null;
    this.errorMessage = null;
  }
}