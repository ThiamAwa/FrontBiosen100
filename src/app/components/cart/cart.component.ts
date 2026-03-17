import { CommonModule , isPlatformBrowser } from '@angular/common';
import {CartItem, CartService} from '../../services/cart/cart.service';
import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';


declare var bootstrap: any;
@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {

  constructor( 
      public cartService: CartService,
      private router: Router,
      @Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    
  }
  getCartItemImage(item: CartItem): string {
    return item.image?.trim() ? item.image : '';
  }
  clearCart(): void { this.cartService.clearCart(); }

  get cartItems(): CartItem[] { return this.cartService.getCart(); }

  get cartSubtotal(): number { return this.cartService.getCartTotal(); }

  get cartCount(): number { return this.cartService.getCartCount(); }

  increaseQuantity (item: CartItem): void { this.cartService.incrementQuantity(item.id); }
  decreaseQuantity(item: CartItem): void { this.cartService.decrementQuantity(item.id); }
  removeFromCart(id: number): void { this.cartService.removeFromCart(id); }

  goToCheckout(): void {
    if (isPlatformBrowser(this.platformId) && typeof bootstrap !== 'undefined') {
      const cartModalEl = document.getElementById('cartModal');
      if (cartModalEl) {
        const instance = bootstrap.Modal.getInstance(cartModalEl);
        if (instance) instance.hide();
      }
    }
    this.router.navigate(['/checkout']);
  }
  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price);
  }

}
