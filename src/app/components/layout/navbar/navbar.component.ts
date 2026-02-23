import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from '../../../services/cart/cart.service';

import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  cartService = inject(CartService);
  authService = inject(AuthService);
  router = inject(Router);

  openCartModal() {
    // Émet un signal pour ouvrir le modal panier
    this.cartService.openCart();
  }

  openLoginModal() {
    this.authService.openLoginModal();
  }

  logout() {
    this.authService.logout();
  }
}