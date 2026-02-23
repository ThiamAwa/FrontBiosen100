import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
// import { CartService } from '../../../core/services/cart.service';
// import { CartItemComponent } from './cart-item/cart-item.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule,],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent {
  // cartService = inject(CartService);
  router = inject(Router);
  promoCode = '';

  close() {
    // this.cartService.closeCart();
  }

  goToShop() {
    this.close();
    this.router.navigate(['/boutique']);
  }

  checkout() {
    // if (this.cartService.totalItems() === 0) return;
    this.close();
    this.router.navigate(['/checkout']);
  }

  applyPromo() {
    // logique code promo
    console.log('Code promo:', this.promoCode);
  }
}