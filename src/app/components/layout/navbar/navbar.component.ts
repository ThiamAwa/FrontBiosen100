import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  authService = inject(AuthService);
  router = inject(Router);

  openCartModal() {
    const el = document.getElementById('cartModal');
    if (el) {
      const modal = (window as any).bootstrap.Modal.getOrCreateInstance(el);
      modal.show();
    }
  }

  openLoginModal() {
    this.authService.openLoginModal();
  }

  logout() {
    this.authService.logout();
  }
}
