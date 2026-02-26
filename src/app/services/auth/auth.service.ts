import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface User {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  avatar?: string;
  isAdmin?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public currentUser = signal<User | null>(null);
  public loginModalOpen = signal<boolean>(false);

  constructor(private router: Router) { }

  openLoginModal(): void {
    this.loginModalOpen.set(true);
  }

  closeLoginModal(): void {
    this.loginModalOpen.set(false);
  }

  /**
   * Connexion avec email/password.
   * Remplacez le corps par votre appel HTTP réel.
   */
  async login(credentials: LoginCredentials): Promise<void> {
    // Simulation pour le développement :
    if (credentials.email === 'admin@biosen.com' && credentials.password === 'admin') {
      const user: User = {
        id: 1,
        prenom: 'Admin',
        nom: 'BioSen',
        email: credentials.email,
        isAdmin: true
      };
      this.currentUser.set(user);
      if (credentials.remember) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      // Redirection dans tous les cas
      this.router.navigate(['/admin/dashboard']);
    } else {
      throw new Error('Email ou mot de passe incorrect.');
    }
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    this.router.navigate(['/']);
  }
}