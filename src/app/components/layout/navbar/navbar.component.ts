import { Component, inject, OnInit, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, LoginCredentials } from '../../../services/auth/auth.service';
import { CartService } from '../../../services/cart/cart.service';
import { HomeService } from '../../../services/home/home.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  produitsPromo: any[] = [];
  homeService = inject(HomeService);
  authService = inject(AuthService);
  cartService = inject(CartService);
  router = inject(Router);

  // Propriétés du formulaire de connexion
  isLoading = false;
  errors: string[] = [];
  credentials: LoginCredentials = {
    email: '',
    password: '',
    remember: false
  };

  // Propriété pour le menu latéral
  isOffcanvasOpen = false;

  ngOnInit(): void {
    this.homeService.produitsPromo$.subscribe(data => {
      this.produitsPromo = data;
    });
  }

  // Ouvrir le menu latéral
  toggleOffcanvasMenu() {
    this.isOffcanvasOpen = !this.isOffcanvasOpen;
    if (this.isOffcanvasOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  // Fermer le menu latéral
  closeOffcanvasMenu() {
    this.isOffcanvasOpen = false;
    document.body.style.overflow = '';
  }

  // Fermer le menu avec la touche Echap
  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: KeyboardEvent) {
    if (this.isOffcanvasOpen) {
      this.closeOffcanvasMenu();
    }
  }

  openLoginModal() {
    this.authService.openLoginModal();
    this.closeOffcanvasMenu();
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
    this.closeOffcanvasMenu();
  }

  openCartModal() {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
      // @ts-ignore
      const modal = new bootstrap.Modal(cartModal);
      modal.show();
    }
  }
}