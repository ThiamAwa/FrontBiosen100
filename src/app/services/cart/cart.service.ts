import { Injectable, signal, computed } from '@angular/core';

// Interface représentant un article dans le panier
export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  // Signal contenant la liste des articles du panier
  private itemsSignal = signal<CartItem[]>([]);

  // Propriété publique en lecture seule
  public items = this.itemsSignal.asReadonly();

  // Signal calculé pour le nombre total d'articles (somme des quantités)
  public totalItems = computed(() => {
    return this.itemsSignal().reduce((total, item) => total + item.quantity, 0);
  });

  // Signal calculé pour le prix total
  public totalPrice = computed(() => {
    return this.itemsSignal().reduce((total, item) => total + (item.price * item.quantity), 0);
  });

  constructor() {
    // Optionnel : ajouter des articles factices pour le développement (à commenter ensuite)
    // this.addMockItems();
  }

  /**
   * Ouvre le modal du panier.
   * À implémenter selon votre système de modals.
   */
  openCart(): void {
    console.log('Ouverture du panier');
    // Exemple avec NgbModal :
    // const modalRef = this.modalService.open(CartModalComponent);
    // modalRef.componentInstance.cartItems = this.itemsSignal();
  }

  /**
   * Ajoute un article au panier (ou augmente sa quantité s'il existe déjà).
   */
  addItem(item: CartItem): void {
    const currentItems = this.itemsSignal();
    const existingItem = currentItems.find(i => i.id === item.id);

    if (existingItem) {
      // Augmenter la quantité
      existingItem.quantity += item.quantity;
      // Forcer la mise à jour du signal (en créant un nouveau tableau)
      this.itemsSignal.set([...currentItems]);
    } else {
      // Ajouter le nouvel article
      this.itemsSignal.set([...currentItems, { ...item }]);
    }
  }

  /**
   * Supprime un article du panier (par son id).
   */
  removeItem(itemId: number): void {
    const currentItems = this.itemsSignal();
    this.itemsSignal.set(currentItems.filter(item => item.id !== itemId));
  }

  /**
   * Modifie la quantité d'un article (si quantité <= 0, supprime l'article).
   */
  updateQuantity(itemId: number, quantity: number): void {
    const currentItems = this.itemsSignal();
    const item = currentItems.find(i => i.id === itemId);

    if (item) {
      if (quantity <= 0) {
        this.removeItem(itemId);
      } else {
        item.quantity = quantity;
        this.itemsSignal.set([...currentItems]);
      }
    }
  }

  /**
   * Vide complètement le panier.
   */
  clearCart(): void {
    this.itemsSignal.set([]);
  }

  // --- Méthodes utilitaires pour le développement (à supprimer ensuite) ---
  private addMockItems(): void {
    const mockItems: CartItem[] = [
      { id: 1, name: 'Produit bio 1', price: 15.99, quantity: 2, image: 'assets/img/products/product1.jpg' },
      { id: 2, name: 'Produit bio 2', price: 24.50, quantity: 1, image: 'assets/img/products/product2.jpg' }
    ];
    this.itemsSignal.set(mockItems);
  }
}