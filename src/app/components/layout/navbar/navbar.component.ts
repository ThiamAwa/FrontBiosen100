import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../services/cart/cart.service';
import { AuthService, LoginCredentials } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  authService = inject(AuthService);
  router = inject(Router);

  // Propriétés du formulaire de connexion
  isLoading = false;
  errors: string[] = [];
  credentials: LoginCredentials = {
    email: '',
    password: '',
    remember: false
  };

  openCartModal() {
    this.cartService.openCart();
  }

  openLoginModal() {
    this.authService.openLoginModal();
  }

  close() {
    this.authService.closeLoginModal();
    this.errors = [];
    this.credentials = { email: '', password: '', remember: false };
  }

  async login() {
    this.isLoading = true;
    this.errors = [];
    try {
      await this.authService.login(this.credentials);
      this.close();
    } catch (err: any) {
      this.errors = [err?.message ?? 'Une erreur est survenue lors de la connexion.'];
    } finally {
      this.isLoading = false;
    }
  }

  logout() {
    this.authService.logout();
  }
}
