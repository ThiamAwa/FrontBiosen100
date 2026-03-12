import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {CartItem, CartService} from '../../services/cart/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  totalItems = 0;
  totalAmount = 0;

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    // S'abonner aux changements du panier
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
      this.calculateTotals();
    });
  }

  calculateTotals(): void {
    this.totalItems = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
    this.totalAmount = this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  updateQuantity(itemId: number, change: number): void {
    const item = this.cartItems.find(i => i.id === itemId);
    if (item) {
      const newQuantity = item.quantity + change;
      if (newQuantity > 0) {
        this.cartService.updateQuantity(itemId, newQuantity);
      } else {
        this.removeItem(itemId);
      }
    }
  }

  removeItem(itemId: number): void {
    this.cartService.removeFromCart(itemId);
  }

  clearCart(): void {
    this.cartService.clearCart();
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  }

  // Fermer le modal
  closeModal(): void {
    const modal = document.getElementById('cartModal');
    if (modal) {
      // @ts-ignore
      const modalInstance = bootstrap.Modal.getInstance(modal);
      if (modalInstance) {
        modalInstance.hide();
      }
    }
  }

  // Aller au checkout
  goToCheckout(): void {
    this.closeModal();
    // Navigation vers la page checkout
    window.location.href = '/checkout';
  }
}
