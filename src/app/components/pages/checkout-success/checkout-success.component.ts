import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CheckoutService } from '../../../services/checkout/checkout.service';
import { CartService } from '../../../services/cart/cart.service';

@Component({
  selector: 'app-checkout-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './checkout-success.component.html',
  styleUrls: ['./checkout-success.component.css']
})
export class CheckoutSuccessComponent implements OnInit {
  commandeNumber: string = '';
  downloading = false;
  isLoading = true;
  error: string | null = null;

  // Pour le compte à rebours
  countdown = 5;
  private countdownInterval: any;

  constructor(
    private route: ActivatedRoute,
    private checkoutService: CheckoutService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('=== DÉBUT INIT CHECKOUT SUCCESS ===');

    // Récupérer les tokens de l'URL
    const queryParams = this.route.snapshot.queryParams;
    console.log('Query params reçus:', queryParams);

    const paymentToken = queryParams['token'];
    console.log('Token extrait:', paymentToken);

    if (!paymentToken) {
      console.error('❌ Token de paiement manquant');
      this.error = 'Token de paiement manquant';
      this.isLoading = false;
      return;
    }

    // Vérifier si on a des données en attente
    const pendingOrder = sessionStorage.getItem('pending_order');
    console.log('pending_order récupéré:', pendingOrder ? 'OUI' : 'NON');

    if (!pendingOrder) {
      console.error('❌ Session de paiement expirée');
      this.error = 'Session de paiement expirée';
      this.isLoading = false;
      return;
    }

    console.log('📦 Données de la commande en attente:', JSON.parse(pendingOrder));
    console.log('✅ Confirmation du paiement...');

    // Confirmer le paiement et créer la commande
    this.confirmPayment(paymentToken);
  }

  confirmPayment(paymentToken: string): void {
    console.log('=== DÉBUT CONFIRM PAYMENT ===');

    const pendingOrder = sessionStorage.getItem('pending_order');
    const orderData = JSON.parse(pendingOrder || '{}');

    const payload = {
      ...orderData,
      payment_token: paymentToken
    };
    console.log('Payload envoyé à confirm-payment:', payload);

    this.checkoutService.confirmPaymentAndCreateOrder(payload).subscribe({
      next: (response) => {
        console.log('✅ Réponse reçue:', response);
        this.commandeNumber = response.order_number;
        this.isLoading = false;

        // Nettoyer le sessionStorage
        sessionStorage.removeItem('pending_order');
        sessionStorage.removeItem('payment_token');

        // Vider le panier
        this.cartService.clearCart();

        // Démarrer le compte à rebours
        this.startCountdown();
      },
      error: (err) => {
        console.error('❌ Erreur création commande:', err);
        console.error('Status:', err.status);
        console.error('Message:', err.message);
        console.error('Erreur détaillée:', err.error);

        this.error = err.error?.message || 'Erreur lors de la création de la commande';
        this.isLoading = false;
      }
    });
  }

  startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown === 0) {
        clearInterval(this.countdownInterval);
        this.router.navigate(['/']);
      }
    }, 1000);
  }

  downloadInvoice(): void {
    if (!this.commandeNumber) return;

    this.downloading = true;
    this.checkoutService.downloadInvoice(this.commandeNumber).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Facture_${this.commandeNumber}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.downloading = false;
      },
      error: (err) => {
        console.error('Erreur téléchargement:', err);
        alert('Erreur lors du téléchargement de la facture');
        this.downloading = false;
      }
    });
  }

  goToHome(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
