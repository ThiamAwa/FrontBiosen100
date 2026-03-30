import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { UserService, UserProfile, Order } from '../../../services/user/user.service';

type ActiveTab = 'profil' | 'commandes' | 'securite';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  authService = inject(AuthService);
  userService = inject(UserService);

  activeTab = signal<ActiveTab>('commandes');

  // Profil
  profile = signal<UserProfile | null>(null);
  isLoadingProfile = signal(false);

  // Commandes
  orders = signal<Order[]>([]);
  isLoadingOrders = signal(false);
  selectedOrder = signal<any | null>(null);
  isLoadingOrderDetails = signal(false);

  // Sécurité
  passwordForm = {
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  };
  passwordSuccess = '';
  passwordError = '';
  isChangingPassword = false;

  // Edition profil
  isEditing = signal(false);
  editForm: Partial<UserProfile> = {};
  editSuccess = '';
  editError = '';
  isSaving = signal(false);

  ngOnInit(): void {
    this.loadProfile();
    this.loadOrders();
  }

  // ── Chargement profil ──────────────────────────────────────
  loadProfile(): void {
    this.isLoadingProfile.set(true);
    this.userService.getProfile().subscribe({
      next: (p) => {
        this.profile.set(p);
        this.isLoadingProfile.set(false);
      },
      error: () => this.isLoadingProfile.set(false),
    });
  }

  // ── Chargement commandes ───────────────────────────────────
  loadOrders(): void {
    this.isLoadingOrders.set(true);
    this.userService.getOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.isLoadingOrders.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement commandes:', err);
        this.isLoadingOrders.set(false);
      },
    });
  }

  // ── Détails d'une commande ─────────────────────────────────
  viewOrderDetails(orderId: number): void {
    this.isLoadingOrderDetails.set(true);
    this.selectedOrder.set(null);
    this.userService.getOrderDetails(orderId).subscribe({
      next: (details) => {
        this.selectedOrder.set(details);
        this.isLoadingOrderDetails.set(false);
      },
      error: () => this.isLoadingOrderDetails.set(false),
    });
  }

  closeOrderDetails(): void {
    this.selectedOrder.set(null);
  }

  // ── Onglets ────────────────────────────────────────────────
  setTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
    if (tab === 'commandes' && this.orders().length === 0) {
      this.loadOrders();
    }
  }

  // ── Edition profil ─────────────────────────────────────────
  startEdit(): void {
    const p = this.profile();
    if (p) {
      this.editForm = {
        nom: p.nom,
        prenom: p.prenom,
        telephone: p.telephone,
        adresse: p.adresse,
        genre: p.genre,
        date_naissance: p.date_naissance,
        newsletter: p.newsletter,
      };
    }
    this.isEditing.set(true);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.editSuccess = '';
    this.editError = '';
  }

  saveProfile(): void {
    this.isSaving.set(true);
    this.editSuccess = '';
    this.editError = '';

    this.userService.updateProfile(this.editForm as any).subscribe({
      next: (updated: any) => {
        // La réponse contient { message, user }
        const updatedUser = updated.user ?? updated;
        this.profile.set(updatedUser);
        this.editSuccess = 'Profil mis à jour avec succès !';
        this.isEditing.set(false);
        this.isSaving.set(false);
      },
      error: () => {
        this.editError = 'Erreur lors de la mise à jour.';
        this.isSaving.set(false);
      },
    });
  }

  // ── Changement de mot de passe ─────────────────────────────
  changePassword(): void {
    this.isChangingPassword = true;
    this.passwordSuccess = '';
    this.passwordError = '';

    this.userService.changePassword(this.passwordForm).subscribe({
      next: () => {
        this.passwordSuccess = 'Mot de passe modifié avec succès !';
        this.passwordForm = {
          current_password: '',
          new_password: '',
          new_password_confirmation: '',
        };
        this.isChangingPassword = false;
      },
      error: (err) => {
        this.passwordError =
          err.error?.errors?.current_password?.[0] ||
          err.error?.message ||
          'Erreur lors du changement de mot de passe.';
        this.isChangingPassword = false;
      },
    });
  }

  // ── Utilitaires ────────────────────────────────────────────
  getInitials(): string {
    const p = this.profile();
    if (!p) return '??';
    return `${p.prenom?.[0] ?? ''}${p.nom?.[0] ?? ''}`.toUpperCase();
  }

  getStatusBadge(status: string): string {
    return this.userService.getOrderStatusBadge(status);
  }

  getStatusLabel(status: string): string {
    return this.userService.getOrderStatusLabel(status);
  }

  formatPrice(price: number): string {
    return this.userService.formatPrice(price);
  }

  logout(): void {
    this.authService.logout();
  }
}