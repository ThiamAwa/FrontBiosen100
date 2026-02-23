import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

// Interface représentant un utilisateur (adaptez selon vos données)
export interface User {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  avatar?: string;
  isAdmin?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Signal contenant l'utilisateur courant (null si non connecté)
  public currentUser = signal<User | null>(null);

  constructor(private router: Router) {
    // Optionnel : simuler un utilisateur pour les tests (à commenter en production)
    // this.setMockUser();
  }

  /**
   * Ouvre le modal de connexion.
   * À implémenter selon votre système de modals (ex: MatDialog, NgbModal, etc.)
   */
  openLoginModal(): void {
    console.log('Ouverture du modal de connexion');
    // Exemple avec NgbModal :
    // const modalRef = this.modalService.open(LoginModalComponent);
    // modalRef.result.then(user => this.login(user)).catch(() => {});
  }

  /**
   * Déconnecte l'utilisateur et redirige vers l'accueil.
   */
  logout(): void {
    this.currentUser.set(null);
    // Effacer d'éventuels tokens stockés (localStorage, etc.)
    localStorage.removeItem('token');
    this.router.navigate(['/']);
  }

  /**
   * Connecte un utilisateur (appelé après succès d'authentification).
   */
  login(user: User): void {
    this.currentUser.set(user);
    // Stocker le token si nécessaire
    // localStorage.setItem('token', user.token);
  }

  // --- Méthodes utilitaires pour le développement (à supprimer ensuite) ---
  private setMockUser(): void {
    const mockUser: User = {
      id: 1,
      prenom: 'Jean',
      nom: 'Dupont',
      email: 'jean.dupont@example.com',
      avatar: 'assets/img/avatars/default.jpg',
      isAdmin: true
    };
    this.currentUser.set(mockUser);
  }
}