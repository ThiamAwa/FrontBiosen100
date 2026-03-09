import { Component, Input, Output, EventEmitter, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth/auth.service';

@Component({
  selector: 'app-admin-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './admin-navbar.component.html',
  styleUrl: './admin-navbar.component.css'
})
export class AdminNavbarComponent {
  authService = inject(AuthService);

  @Input() sidebarCollapsed = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  searchQuery = '';
  dropdownOpen = false; // ✅ contrôle Angular du dropdown

  onToggle() {
    this.toggleSidebar.emit();
  }

  toggleDropdown(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
  }

  // ✅ Fermer le dropdown si on clique ailleurs
  @HostListener('document:click')
  closeDropdown() {
    this.dropdownOpen = false;
  }

  logout() {
    this.dropdownOpen = false;
    this.authService.logout();
  }

  getInitiale(): string {
    const user = this.authService.currentUser();
    return (user?.prenom || user?.nom || 'A').charAt(0).toUpperCase();
  }

  getNomComplet(): string {
    const user = this.authService.currentUser();
    return [user?.prenom, user?.nom].filter(Boolean).join(' ') || 'Administrateur';
  }

  getEmail(): string {
    return this.authService.currentUser()?.email ?? '';
  }
}