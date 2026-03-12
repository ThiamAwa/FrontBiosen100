import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  boutique_id?: number;
  boutique?: any;
  role?: string;
  isAdmin?: boolean;
  hasAdminAccess?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember: boolean;
}

export interface LoginResponse {
  message: string;
  statut: boolean;
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  public currentUser = signal<User | null>(null);
  public loginModalOpen = signal<boolean>(false);
  private tokenKey = 'auth_token';
  private userKey = 'user_data';

  // Liste des rôles autorisés à accéder à l'admin
  private adminRoles = ['admin', 'responsable commercial', 'vendeur', 'commercial'];
  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    this.loadStoredUser();
  }

  /**
   * Charger l'utilisateur stocké dans localStorage
   */
  private loadStoredUser(): void {
    const token = localStorage.getItem(this.tokenKey);
    const userData = localStorage.getItem(this.userKey);

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        // Ajouter les champs calculés
        user.hasAdminAccess = this.hasAdminRole(user.role);
        user.isAdmin = user.hasAdminAccess;
        this.currentUser.set(user);
      } catch (e) {
        this.clearStorage();
      }
    }
  }

  /**
   * Vérifier si le rôle a accès à l'admin
   */
  private hasAdminRole(role?: string): boolean {
    if (!role) return false;

    // Convertir le rôle en minuscules pour la comparaison
    const roleLower = role.toLowerCase();

    // Vérifier si le rôle (en minuscules) est dans la liste des adminRoles
    return this.adminRoles.includes(roleLower);
  }

  /**
   * Ouvrir le modal de connexion
   */
  openLoginModal(): void {
    this.loginModalOpen.set(true);
  }

  /**
   * Fermer le modal de connexion
   */
  closeLoginModal(): void {
    this.loginModalOpen.set(false);
  }

  /**
   * Connexion avec email/password
   */

  async login(credentials: LoginCredentials): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      );

      if (response.statut && response.token) {
        // Stocker le token
        localStorage.setItem(this.tokenKey, response.token);

        // Vérifier si l'utilisateur a accès à l'admin
        const hasAdminAccess = this.hasAdminRole(response.user.role);

        // Ajouter les champs à l'utilisateur
        const user = {
          ...response.user,
          hasAdminAccess,
          isAdmin: hasAdminAccess
        };

        // Stocker les données utilisateur
        localStorage.setItem(this.userKey, JSON.stringify(user));
        this.currentUser.set(user);

        // Redirection selon le rôle
        if (hasAdminAccess) {
          console.log(`Accès admin autorisé pour le rôle: ${user.role}`);
          this.router.navigate(['/admin/dashboard']);
        } else {
          console.log(`Accès public pour le rôle: ${user.role || 'non spécifié'}`);
          this.router.navigate(['/']);
        }
      } else {
        throw new Error('Réponse invalide du serveur');
      }
    } catch (error: any) {
      console.error('Erreur login:', error);
      throw error;
    }
  }
  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${this.apiUrl}/logout`, {}));
    } catch (e) {
      console.error('Erreur lors de la déconnexion API', e);
    } finally {
      this.clearStorage();
      this.currentUser.set(null);
      this.router.navigate(['/']);
    }
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  /**
   * Vérifier si l'utilisateur a accès à l'admin
   */
  canAccessAdmin(): boolean {
    return this.currentUser()?.hasAdminAccess || false;
  }

  /**
   * Obtenir le token JWT
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Nettoyer le stockage
   */
  private clearStorage(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }
}
