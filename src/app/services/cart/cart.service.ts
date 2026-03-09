import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartKey = 'biosen_cart';
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItemsSubject.asObservable();

  private cartCountSubject = new BehaviorSubject<number>(0);
  public cartCount$ = this.cartCountSubject.asObservable();

  private cartTotalSubject = new BehaviorSubject<number>(0);
  public cartTotal$ = this.cartTotalSubject.asObservable();

  constructor() {
    this.loadCartFromStorage();
  }

  // ========== MÉTHODES PRIVÉES ==========

  /**
   * Charger le panier depuis localStorage
   */
  private loadCartFromStorage(): void {
    try {
      const savedCart = localStorage.getItem(this.cartKey);
      const cart = savedCart ? JSON.parse(savedCart) : [];
      this.cartItemsSubject.next(cart);
      this.updateStats();
    } catch (error) {
      console.error('Erreur chargement panier:', error);
      this.cartItemsSubject.next([]);
    }
  }

  /**
   * Sauvegarder le panier dans localStorage
   */
  private saveCartToStorage(cart: CartItem[]): void {
    try {
      localStorage.setItem(this.cartKey, JSON.stringify(cart));
      this.cartItemsSubject.next(cart);
      this.updateStats();
    } catch (error) {
      console.error('Erreur sauvegarde panier:', error);
    }
  }

  /**
   * Mettre à jour les statistiques (nombre d'articles, total)
   */
  private updateStats(): void {
    const cart = this.cartItemsSubject.value;
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    this.cartCountSubject.next(count);
    this.cartTotalSubject.next(total);
  }

  // ========== MÉTHODES PUBLIQUES ==========

  /**
   * Récupérer tout le panier
   */
  getCart(): CartItem[] {
    return this.cartItemsSubject.value;
  }

  /**
   * Récupérer le nombre total d'articles
   */
  getCartCount(): number {
    return this.cartCountSubject.value;
  }

  /**
   * Récupérer le montant total du panier
   */
  getCartTotal(): number {
    return this.cartTotalSubject.value;
  }

  /**
   * Ajouter un article au panier
   */
  addToCart(item: CartItem): void {
    const currentCart = this.getCart();
    const existingItem = currentCart.find(i => i.id === item.id);

    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      currentCart.push(item);
    }

    this.saveCartToStorage(currentCart);
  }

  /**
   * Mettre à jour la quantité d'un article
   */
  updateQuantity(itemId: number, quantity: number): void {
    const currentCart = this.getCart();
    const item = currentCart.find(i => i.id === itemId);

    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(itemId);
      } else {
        item.quantity = quantity;
        this.saveCartToStorage(currentCart);
      }
    }
  }

  /**
   * Augmenter la quantité d'un article
   */
  incrementQuantity(itemId: number): void {
    const currentCart = this.getCart();
    const item = currentCart.find(i => i.id === itemId);

    if (item) {
      item.quantity++;
      this.saveCartToStorage(currentCart);
    }
  }

  /**
   * Diminuer la quantité d'un article
   */
  decrementQuantity(itemId: number): void {
    const currentCart = this.getCart();
    const item = currentCart.find(i => i.id === itemId);

    if (item) {
      if (item.quantity <= 1) {
        this.removeFromCart(itemId);
      } else {
        item.quantity--;
        this.saveCartToStorage(currentCart);
      }
    }
  }

  /**
   * Supprimer un article du panier
   */
  removeFromCart(itemId: number): void {
    const currentCart = this.getCart().filter(item => item.id !== itemId);
    this.saveCartToStorage(currentCart);
  }

  /**
   * Vider complètement le panier
   */
  clearCart(): void {
    this.saveCartToStorage([]);
  }

  /**
   * Vérifier si le panier est vide
   */
  isEmpty(): boolean {
    return this.getCartCount() === 0;
  }

  /**
   * Vérifier si un article est dans le panier
   */
  isInCart(itemId: number): boolean {
    return this.getCart().some(item => item.id === itemId);
  }

  /**
   * Récupérer la quantité d'un article spécifique
   */
  getItemQuantity(itemId: number): number {
    const item = this.getCart().find(i => i.id === itemId);
    return item?.quantity || 0;
  }

  /**
   * Formater le prix (utilitaire)
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  }
}
