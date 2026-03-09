import { Component, Input, Output, EventEmitter, inject, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';  // Ajout du Router
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth/auth.service';

@Component({
  selector: 'app-admin-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './admin-navbar.component.html',
  styleUrl: './admin-navbar.component.css'
})
export class AdminNavbarComponent implements AfterViewInit {
  authService = inject(AuthService);
  router = inject(Router);  // Pour la redirection après logout

  @Input() sidebarCollapsed = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  @ViewChild('dropdownContainer') dropdownContainer!: ElementRef;

  searchQuery = '';
  dropdownOpen = false;

  ngAfterViewInit() {
    // Optionnel : vérifier que la référence est bien présente
    if (!this.dropdownContainer) {
      console.error('dropdownContainer reference not found');
    }
  }

  onToggle() {
    this.toggleSidebar.emit();
  }

  toggleDropdown(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
  }

  // Ferme le dropdown uniquement si le clic est en dehors du conteneur
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Protection si la référence n'existe pas encore (ne devrait pas arriver)
    if (this.dropdownContainer && this.dropdownOpen) {
      if (!this.dropdownContainer.nativeElement.contains(event.target)) {
        this.dropdownOpen = false;
      }
    }
  }

  logout() {
    this.dropdownOpen = false;
    this.authService.logout();
    // Rediriger vers la page de connexion (ou accueil public)
    this.router.navigate(['/login']);
  }

  // Méthodes sécurisées avec valeurs par défaut
  getInitiale(): string {
    const user = this.authService.currentUser();
    if (!user) return 'A';  // utilisateur non chargé
    return (user.prenom || user.nom || 'A').charAt(0).toUpperCase();
  }

  getNomComplet(): string {
    const user = this.authService.currentUser();
    if (!user) return 'Administrateur';
    return [user.prenom, user.nom].filter(Boolean).join(' ') || 'Administrateur';
  }

  getEmail(): string {
    const user = this.authService.currentUser();
    return user?.email ?? '';
  }
}