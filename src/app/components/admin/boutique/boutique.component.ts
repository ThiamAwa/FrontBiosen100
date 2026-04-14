import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoutiqueService } from '../../../services/boutique/boutique.service';
import { Boutique, BoutiqueResponse } from '../../../models/boutique';

@Component({
  selector: 'app-boutique',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './boutique.component.html',
  styleUrls: ['./boutique.component.css']
})
export class BoutiqueComponent implements OnInit {
  boutiques: Boutique[] = [];
  currentPage = 1;
  lastPage = 1;
  total = 0;
  firstItem = 0;
  lastItem = 0;

  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showPersonnelModal = false;
  selectedBoutique: Boutique | null = null;
  boutiqueToDelete: Boutique | null = null;
  personnelBoutique: Boutique | null = null;

  createForm = { nom: '', adresse: '' };
  editForm = { id: 0, nom: '', adresse: '' };

  createImagePreview: string | null = null;
  editImagePreview: string | null = null;
  createImageFile: File | null = null;
  editImageFile: File | null = null;

  successMessage: string | null = null;
  errorMessage: string | null = null;
  validationErrors: string[] = [];

  hasPersonnel = false;

  // Plus besoin d'injecter HttpClient
  constructor(private boutiqueService: BoutiqueService) { }

  ngOnInit(): void {
    this.loadBoutiques();
  }

  loadBoutiques(page: number = 1): void {
    this.boutiqueService.getBoutiques(page).subscribe({
      next: (res: BoutiqueResponse) => {
        this.boutiques = res.data;
        this.currentPage = res.current_page;
        this.lastPage = res.last_page;
        this.total = res.total;
        this.firstItem = res.from || 0;
        this.lastItem = res.to || 0;
      },
      error: (err) => {
        console.error('Erreur chargement boutiques', err);
        this.errorMessage = 'Impossible de charger les boutiques.';
      }
    });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.lastPage) {
      this.loadBoutiques(page);
    }
  }

  onFileSelected(event: any, mode: 'create' | 'edit'): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (mode === 'create') {
          this.createImagePreview = e.target.result;
          this.createImageFile = file;
        } else {
          this.editImagePreview = e.target.result;
          this.editImageFile = file;
        }
      };
      reader.readAsDataURL(file);
    } else {
      if (mode === 'create') {
        this.createImagePreview = null;
        this.createImageFile = null;
      } else {
        this.editImagePreview = null;
        this.editImageFile = null;
      }
    }
  }

  openCreateModal(): void {
    this.createForm = { nom: '', adresse: '' };
    this.createImagePreview = null;
    this.createImageFile = null;
    this.validationErrors = [];
    this.errorMessage = null;
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.createImagePreview = null;
    this.createImageFile = null;
  }

  createBoutique(): void {
    const formData = new FormData();
    formData.append('nom', this.createForm.nom);
    formData.append('adresse', this.createForm.adresse);
    if (this.createImageFile) {
      formData.append('image', this.createImageFile);
    }

    this.boutiqueService.createBoutiqueWithImage(formData).subscribe({
      next: () => {
        this.successMessage = 'Boutique créée avec succès.';
        this.closeCreateModal();
        this.loadBoutiques(this.currentPage);
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

  openEditModal(boutique: Boutique): void {
    this.selectedBoutique = boutique;
    this.editForm = {
      id: boutique.id,
      nom: boutique.nom,
      adresse: boutique.adresse
    };
    this.editImagePreview = null;
    this.editImageFile = null;
    this.validationErrors = [];
    this.errorMessage = null;
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedBoutique = null;
    this.editImagePreview = null;
    this.editImageFile = null;
  }

  updateBoutique(): void {
    if (!this.selectedBoutique) return;

    const formData = new FormData();
    formData.append('nom', this.editForm.nom);
    formData.append('adresse', this.editForm.adresse);
    if (this.editImageFile) {
      formData.append('image', this.editImageFile);
    }

    this.boutiqueService.updateBoutiqueWithImage(this.editForm.id, formData).subscribe({
      next: () => {
        this.successMessage = 'Boutique modifiée avec succès.';
        this.closeEditModal();
        this.loadBoutiques(this.currentPage);
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

  openDeleteModal(boutique: Boutique): void {
    this.boutiqueToDelete = boutique;
    this.hasPersonnel = (boutique.users_count ?? 0) > 0;
    this.errorMessage = null;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.boutiqueToDelete = null;
  }

  deleteBoutique(): void {
    if (!this.boutiqueToDelete) return;
    this.boutiqueService.deleteBoutique(this.boutiqueToDelete.id).subscribe({
      next: (res) => {
        this.successMessage = res.message || 'Boutique supprimée.';
        this.closeDeleteModal();
        this.loadBoutiques(this.currentPage);
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

  openPersonnelModal(boutique: Boutique): void {
    this.personnelBoutique = boutique;
    this.showPersonnelModal = true;
  }

  closePersonnelModal(): void {
    this.showPersonnelModal = false;
    this.personnelBoutique = null;
  }

  truncate(text: string, limit: number): string {
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  }

  getRoleIcon(roleName: string | undefined): string {
    if (!roleName) return 'fa-user';
    switch (roleName) {
      case 'Responsable Commercial': return 'fa-crown';
      case 'Commercial': return 'fa-briefcase';
      case 'Vendeur': return 'fa-user-tie';
      default: return 'fa-user';
    }
  }

  getRoleBadgeClass(roleName: string | undefined): string {
    if (!roleName) return 'bg-secondary';
    switch (roleName) {
      case 'Responsable Commercial': return 'badge-responsable';
      case 'Commercial': return 'badge-commercial';
      case 'Vendeur': return 'badge-vendeur';
      default: return 'bg-secondary';
    }
  }

  closeAlert(): void {
    this.successMessage = null;
    this.errorMessage = null;
  }
}