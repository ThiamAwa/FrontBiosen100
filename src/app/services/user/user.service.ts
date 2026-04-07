// services/user/user.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

// 👇 AJOUTER CES INTERFACES
export interface UserProfile {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse?: string;
  date_naissance?: string;
  genre?: string;
  avatar?: string;
  newsletter?: boolean;
  role?: string;
  boutique?: any;
  commandes_count?: number;
  created_at?: string;
}

export interface UpdateProfileData {
  nom?: string;
  prenom?: string;
  telephone?: string;
  adresse?: string;
  date_naissance?: string;
  genre?: string;
  newsletter?: boolean;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface Order {
  id: number;
  numeroCommande: string;
  montantTotal: number;
  statut: string;
  created_at: string;
  produits_count: number;
  livraison?: {
    statut: string;
    frais: number;
  };
}

export interface OrderDetails {
  commande: {
    id: number;
    numeroCommande: string;
    montantTotal: number;
    statut: string;
    created_at: string;
    note?: string;
    methode_paiement: string;
  };
  livraison?: {
    adresse: string;
    telephone: string;
    frais: number;
    statut: string;
    pays: string;
  };
  produits: Array<{
    nom: string;
    quantite: number;
    prix_unitaire: number;
    total: number;
    image?: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl;
  
  public profile = signal<UserProfile | null>(null);
  public orders = signal<Order[]>([]);
  public isLoading = signal<boolean>(false);
  public isLoadingOrders = signal<boolean>(false);

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Créer les headers avec le token
   */
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Créer les headers pour FormData (sans Content-Type)
   */
  private getHeadersForFormData(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Récupérer le profil utilisateur
   */
  getProfile(): Observable<UserProfile> {
    this.isLoading.set(true);
    return this.http.get<UserProfile>(
      `${this.apiUrl}/user/profile`, 
      { headers: this.getHeaders() }
    ).pipe(
      tap({
        next: (profile) => {
          this.profile.set(profile);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Erreur chargement profil:', err);
          this.isLoading.set(false);
        }
      })
    );
  }

  updateProfile(data: UpdateProfileData): Observable<any> {
    this.isLoading.set(true);
    return this.http.put<any>(
      `${this.apiUrl}/user/profile`,
      data,
      { headers: this.getHeaders() }
    ).pipe(
      tap({
        next: (response) => {
          // Laravel retourne { message: '...', user: {...} }
          const updatedUser = response.user ?? response;
          this.profile.set(updatedUser);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Erreur mise à jour profil:', err);
          this.isLoading.set(false);
        }
      })
    );
  }

  /**
   * Changer le mot de passe
   */
  changePassword(data: ChangePasswordData): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/user/change-password`, 
      data,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Uploader un avatar
   */
  uploadAvatar(file: File): Observable<{ message: string; avatar_url: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return this.http.post<{ message: string; avatar_url: string }>(
      `${this.apiUrl}/user/avatar`, 
      formData,
      { headers: this.getHeadersForFormData() }
    ).pipe(
      tap((response) => {
        const currentProfile = this.profile();
        if (currentProfile) {
          this.profile.set({ 
            ...currentProfile, 
            avatar: response.avatar_url 
          });
        }
      })
    );
  }

  /**
   * Supprimer l'avatar
   */
  deleteAvatar(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/user/avatar`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => {
        const currentProfile = this.profile();
        if (currentProfile) {
          this.profile.set({ ...currentProfile, avatar: undefined });
        }
      })
    );
  }

  /**
   * Récupérer les commandes
   */
  getOrders(): Observable<Order[]> {
    this.isLoadingOrders.set(true);
    return this.http.get<Order[]>(
      `${this.apiUrl}/user/orders`,
      { headers: this.getHeaders() }
    ).pipe(
      tap({
        next: (orders) => {
          this.orders.set(orders);
          this.isLoadingOrders.set(false);
        },
        error: (err) => {
          console.error('Erreur chargement commandes:', err);
          this.isLoadingOrders.set(false);
        }
      })
    );
  }

  /**
   * Récupérer les détails d'une commande
   */
  getOrderDetails(orderId: number): Observable<OrderDetails> {
    return this.http.get<OrderDetails>(
      `${this.apiUrl}/user/orders/${orderId}`,
      { headers: this.getHeaders() }
    );
  }

  // 👇 AJOUTER CES MÉTHODES UTILITAIRES MANQUANTES

  /**
   * Formater le statut de commande en badge CSS
   */
  getOrderStatusBadge(status: string): string {
    const badges: { [key: string]: string } = {
      'en_attente': 'bg-warning text-dark',
      'confirmée': 'bg-success text-white',
      'livrée': 'bg-primary text-white',
      'annulée': 'bg-danger text-white',
      'remboursée': 'bg-info text-white'
    };
    return badges[status] || 'bg-secondary text-white';
  }

  /**
   * Formater le statut en français
   */
  getOrderStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'en_attente': 'En attente',
      'confirmée': 'Confirmée',
      'livrée': 'Livrée',
      'annulée': 'Annulée',
      'remboursée': 'Remboursée'
    };
    return labels[status] || status;
  }

  /**
   * Formater le prix
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price).replace('XOF', 'FCFA');
  }

  /**
   * Rafraîchir le profil
   */
  refreshProfile(): void {
    this.getProfile().subscribe();
  }
}