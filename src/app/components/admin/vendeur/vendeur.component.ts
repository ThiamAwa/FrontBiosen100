// vendeur.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VendeurService } from '../../../services/vendeur/vendeur.service';
import { Vendeur, Role, Boutique } from '../../../models/vendeur';

@Component({
  selector: 'app-vendeur',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vendeur.component.html',
  styleUrls: ['./vendeur.component.css']
})
export class VendeurComponent implements OnInit {
  // Données principales
  vendeurs: Vendeur[] = [];
  roles: Role[] = [];
  boutiques: Boutique[] = [];

  // Pagination
  currentPage = 1;
  lastPage = 1;
  total = 0;
  firstItem = 0;
  lastItem = 0;

  // États des modals
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showRoleSelectionModal = false;
  showRoleConfirmModal = false;
  selectedVendeur: Vendeur | null = null;
  vendeurToDelete: Vendeur | null = null;
  vendeurForRoleChange: Vendeur | null = null;

  // Nouveau rôle à attribuer (pour le modal de confirmation)
  newRole: { id: number; name: string; icon: string; color: string } | null = null;

  // Formulaire de création
  createForm = {
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    password: '',
    password_confirmation: '',
    role_id: '',
    boutique_id: ''
  };

  // Formulaire d'édition
  editForm = {
    id: 0,
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    password: '',
    password_confirmation: '',
    role_id: '',
    boutique_id: ''
  };

  // Messages
  successMessage: string | null = null;
  errorMessage: string | null = null;
  validationErrors: string[] = [];

  constructor(private vendeurService: VendeurService) { }

  ngOnInit(): void {
    this.loadVendeurs();
    // this.loadRolesAndBoutiques();
  }

  loadVendeurs(page: number = 1): void {
    this.vendeurService.getVendeurs(page).subscribe({
      next: (res) => {
        this.vendeurs = res.vendeurs.data;
        this.roles = res.roles;
        this.boutiques = res.boutiques;
        this.currentPage = res.vendeurs.current_page;
        this.lastPage = res.vendeurs.last_page;
        this.total = res.vendeurs.total;
        this.firstItem = (this.currentPage - 1) * res.vendeurs.per_page + 1;
        this.lastItem = Math.min(this.currentPage * res.vendeurs.per_page, this.total);
      },
      error: (err) => {
        console.error('Erreur chargement vendeurs', err);
        this.errorMessage = 'Impossible de charger la liste.';
      }
    });
  }

  // Pour rafraîchir après une action
  refreshList(): void {
    this.loadVendeurs(this.currentPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.lastPage) {
      this.loadVendeurs(page);
    }
  }

  // --- Création ---
  openCreateModal(): void {
    this.createForm = {
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      adresse: '',
      password: '',
      password_confirmation: '',
      role_id: '',
      boutique_id: ''
    };
    this.validationErrors = [];
    this.errorMessage = null;
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  createVendeur(): void {
    // Envoi des données
    this.vendeurService.createVendeur(this.createForm).subscribe({
      next: () => {
        this.successMessage = 'Vendeur créé avec succès.';
        this.closeCreateModal();
        this.refreshList();
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
  openEditModal(vendeur: Vendeur): void {
    this.selectedVendeur = vendeur;
    this.editForm = {
      id: vendeur.id,
      nom: vendeur.nom,
      prenom: vendeur.prenom || '',
      email: vendeur.email,
      telephone: vendeur.telephone,
      adresse: vendeur.adresse || '',
      password: '',
      password_confirmation: '',
      role_id: vendeur.role_id.toString(),
      boutique_id: vendeur.boutique_id?.toString() || ''
    };
    this.validationErrors = [];
    this.errorMessage = null;
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedVendeur = null;
  }

  updateVendeur(): void {
    if (!this.selectedVendeur) return;
    const data = { ...this.editForm };
    // Si le mot de passe est vide, on le retire pour ne pas l'envoyer
    // if (!data.password) {
    //   delete data.password;
    //   delete (data as any).password_confirmation;
    // }
    this.vendeurService.updateVendeur(this.selectedVendeur.id, data).subscribe({
      next: () => {
        this.successMessage = 'Vendeur modifié avec succès.';
        this.closeEditModal();
        this.refreshList();
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
  openDeleteModal(vendeur: Vendeur): void {
    this.vendeurToDelete = vendeur;
    this.errorMessage = null;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.vendeurToDelete = null;
  }

  deleteVendeur(): void {
    if (!this.vendeurToDelete) return;
    this.vendeurService.deleteVendeur(this.vendeurToDelete.id).subscribe({
      next: (res) => {
        this.successMessage = res.message || 'Vendeur supprimé.';
        this.closeDeleteModal();
        this.refreshList();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors de la suppression.';
      }
    });
  }

  // --- Changement de rôle ---
  openRoleSelectionModal(vendeur: Vendeur): void {
    this.selectedVendeur = vendeur;
    this.showRoleSelectionModal = true;
  }

  closeRoleSelectionModal(): void {
    this.showRoleSelectionModal = false;
    this.selectedVendeur = null;
  }

  // Appelé lorsqu'on clique sur un rôle dans la sélection
  selectRole(role: Role): void {
    if (!this.selectedVendeur) return;

    // Déterminer l'icône et la couleur selon le rôle (optionnel)
    const roleIcon = this.getRoleIcon(role.name);
    const roleColor = this.getRoleColor(role.name);

    this.newRole = {
      id: role.id,
      name: role.name,
      icon: roleIcon,
      color: roleColor
    };

    // Fermer le modal de sélection
    this.closeRoleSelectionModal();

    // Ouvrir le modal de confirmation
    this.showRoleConfirmModal = true;
  }

  closeRoleConfirmModal(): void {
    this.showRoleConfirmModal = false;
    this.newRole = null;
    this.selectedVendeur = null;
  }

  confirmRoleChange(): void {
    if (!this.selectedVendeur || !this.newRole) return;
    this.vendeurService.changeRole(this.selectedVendeur.id, this.newRole.id).subscribe({
      next: (res) => {
        this.successMessage = res.message;
        this.closeRoleConfirmModal();
        this.refreshList();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors du changement de rôle.';
        this.closeRoleConfirmModal();
      }
    });
  }

  // Helpers pour les icônes et couleurs (optionnels)
  getRoleIcon(roleName: string): string {
    switch (roleName) {
      case 'Responsable Commercial': return 'fa-crown';
      case 'Commercial': return 'fa-briefcase';
      case 'Vendeur': return 'fa-user-tie';
      default: return 'fa-user';
    }
  }

  getRoleColor(roleName: string): string {
    switch (roleName) {
      case 'Responsable Commercial': return '#dc3545';
      case 'Commercial': return '#ff9800';
      case 'Vendeur': return '#2d7a4f';
      default: return '#6c757d';
    }
  }

  getRoleBadgeClass(roleName: string): string {
    switch (roleName) {
      case 'Responsable Commercial': return 'badge-responsable';
      case 'Commercial': return 'badge-commercial';
      case 'Vendeur': return 'badge-vendeur';
      default: return 'bg-secondary';
    }
  }

  // Fermer les alertes
  closeAlert(): void {
    this.successMessage = null;
    this.errorMessage = null;
  }

  // Initiales pour l'avatar
  getInitials(vendeur: Vendeur): string {
    return (vendeur.nom.charAt(0) + (vendeur.prenom ? vendeur.prenom.charAt(0) : '')).toUpperCase();
  }
}