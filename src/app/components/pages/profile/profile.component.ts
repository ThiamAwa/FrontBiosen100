import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { UserService, UserProfile, UpdateProfileData } from '../../../services/user/user.service';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  public userService = inject(UserService);
  public authService = inject(AuthService);
  private router = inject(Router);

  // Onglet actif
  activeTab: 'profil' | 'commandes' | 'securite' = 'profil';

  // Données du formulaire
  profileForm: UpdateProfileData = {
    nom: '',
    prenom: '',
    telephone: '',
    adresse: '',
    date_naissance: '',
    genre: '',
    newsletter: false
  };

  // Mot de passe
  passwordData = {
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  };

  // États
  isSaving = false;
  successMessage = '';
  errors: any = {};
  passwordErrors: any = {};

  // Avatar
  selectedAvatar: File | null = null;
  avatarPreview: string | null = null;
  isUploadingAvatar = false;

  // Commandes
  selectedOrder: any = null;
  showOrderDetails = false;

  ngOnInit(): void {
    this.loadProfile();
    this.loadOrders();
  }

  /**
     * Charger le profil
     */
  loadProfile(): void {
    this.userService.getProfile().subscribe({
      next: (profile) => {
        this.profileForm = {
          nom: profile.nom || '',
          prenom: profile.prenom || '',
          telephone: profile.telephone || '',
          adresse: profile.adresse || '',
          date_naissance: profile.date_naissance || '',
          genre: profile.genre || '',
          newsletter: profile.newsletter || false
        };
      },
      error: (err) => {
        if (err.status === 401) {
          this.router.navigate(['/']);
          this.authService.openLoginModal();
        }
      }
    });
  }

  /**
   * Charger les commandes
   */
  loadOrders(): void {
    this.userService.getOrders().subscribe();
  }

  /**
   * Changer d'onglet
   */
  setActiveTab(tab: 'profil' | 'commandes' | 'securite'): void {
    this.activeTab = tab;
    this.successMessage = '';
    this.errors = {};
    this.passwordErrors = {};
    this.selectedOrder = null;
    this.showOrderDetails = false;
  }

  /**
   * Sauvegarder le profil
   */
  saveProfile(): void {
    this.isSaving = true;
    this.errors = {};
    this.successMessage = '';

    this.userService.updateProfile(this.profileForm).subscribe({
      next: () => {
        this.successMessage = 'Profil mis à jour avec succès';

        // 👇 Recharger complètement le profil
        this.loadProfile();

        this.isSaving = false;

        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (err) => {
        this.isSaving = false;
        if (err.status === 422 && err.error?.errors) {
          this.errors = err.error.errors;
        } else {
          this.errors.general = err.error?.message || 'Une erreur est survenue';
        }
      }
    });
  }

  /**
   * Changer le mot de passe
   */
  changePassword(): void {
    this.isSaving = true;
    this.passwordErrors = {};
    this.successMessage = '';

    this.userService.changePassword(this.passwordData).subscribe({
      next: () => {
        this.successMessage = 'Mot de passe modifié avec succès';
        this.isSaving = false;
        this.passwordData = {
          current_password: '',
          new_password: '',
          new_password_confirmation: ''
        };

        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (err) => {
        this.isSaving = false;
        if (err.status === 422 && err.error?.errors) {
          this.passwordErrors = err.error.errors;
        } else {
          this.passwordErrors.general = err.error?.message || 'Une erreur est survenue';
        }
      }
    });
  }

  /**
   * Sélectionner un avatar
   */
  onAvatarSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Vérifier le type
      if (!file.type.startsWith('image/')) {
        this.errors.avatar = 'Le fichier doit être une image';
        return;
      }

      // Vérifier la taille (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        this.errors.avatar = 'L\'image ne doit pas dépasser 2MB';
        return;
      }

      this.selectedAvatar = file;

      // Créer un aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        this.avatarPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Uploader l'avatar
   */
  uploadAvatar(): void {
    if (!this.selectedAvatar) return;

    this.isUploadingAvatar = true;
    this.errors.avatar = '';

    this.userService.uploadAvatar(this.selectedAvatar).subscribe({
      next: () => {
        this.isUploadingAvatar = false;
        this.selectedAvatar = null;
        this.avatarPreview = null;
        this.successMessage = 'Avatar mis à jour avec succès';

        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (err) => {
        this.isUploadingAvatar = false;
        this.errors.avatar = err.error?.message || 'Erreur lors de l\'upload';
      }
    });
  }

  /**
   * Annuler l'upload d'avatar
   */
  cancelAvatarUpload(): void {
    this.selectedAvatar = null;
    this.avatarPreview = null;
    this.errors.avatar = '';
  }

  /**
   * Supprimer l'avatar
   */
  deleteAvatar(): void {
    if (!confirm('Voulez-vous vraiment supprimer votre avatar ?')) return;

    this.userService.deleteAvatar().subscribe({
      next: () => {
        this.successMessage = 'Avatar supprimé avec succès';

        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (err) => {
        this.errors.avatar = err.error?.message || 'Erreur lors de la suppression';
      }
    });
  }

  /**
   * Voir les détails d'une commande
   */
  viewOrderDetails(order: any): void {
    this.userService.getOrderDetails(order.id).subscribe({
      next: (details) => {
        this.selectedOrder = details;
        this.showOrderDetails = true;
      },
      error: (err) => {
        alert('Erreur lors du chargement des détails de la commande');
      }
    });
  }

  /**
   * Revenir à la liste des commandes
   */
  backToOrders(): void {
    this.showOrderDetails = false;
    this.selectedOrder = null;
  }

  /**
   * Vérifier si un champ est invalide
   */
  isInvalid(field: string): boolean {
    return !!this.errors[field];
  }

  isPasswordInvalid(field: string): boolean {
    return !!this.passwordErrors[field];
  }

  /**
   * Obtenir les initiales pour l'avatar par défaut
   */
  getInitials(): string {
    const profile = this.userService.profile();
    if (!profile) return 'U';

    const first = profile.prenom?.charAt(0) || '';
    const last = profile.nom?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  }
}