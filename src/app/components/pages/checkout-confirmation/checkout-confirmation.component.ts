import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {CheckoutService} from '../../../services/checkout/checkout.service';

@Component({
  selector: 'app-checkout-confirmation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './checkout-confirmation.component.html',
  styleUrls: ['./checkout-confirmation.component.css']
})
export class CheckoutConfirmationComponent implements OnInit {
  orderNumber: string = '';
  order: any = null;
  isLoading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private checkoutService: CheckoutService
  ) {}

  ngOnInit(): void {
    this.orderNumber = this.route.snapshot.paramMap.get('order_number') || '';
    this.loadOrder();
  }

  loadOrder(): void {
    this.checkoutService.getOrder(this.orderNumber).subscribe({
      next: (data) => {
        this.order = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Impossible de charger la commande';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  downloadInvoice(): void {
    this.checkoutService.downloadInvoice(this.orderNumber).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Facture_${this.orderNumber}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Erreur téléchargement:', err);
        alert('Erreur lors du téléchargement de la facture');
      }
    });
  }

  sendWhatsApp(): void {
    this.checkoutService.getWhatsAppMessage(this.orderNumber).subscribe({
      next: (data) => {
        const phone = data.telephone || this.order?.livraison?.telephone;
        const message = encodeURIComponent(data.message || '');
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
      },
      error: (err) => {
        console.error('Erreur WhatsApp:', err);
        alert('Erreur lors de l\'ouverture de WhatsApp');
      }
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  }
}
