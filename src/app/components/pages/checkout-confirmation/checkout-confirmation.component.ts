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

        // Transformer les produits du backend vers le format attendu par le template
        if (data.produits && data.produits.length > 0) {
          this.order.cartItems = data.produits.map((p: any) => ({
            id: p.id,
            name: p.nom,
            category: p.categorie,
            quantity: p.quantite,
            price: p.prix_unitaire,
            image: p.image,
            original: p
          }));

          // Debug : vérifier les données
          console.log('Produits transformés:', this.order.cartItems);
        } else {
          this.order.cartItems = [];
        }

        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Impossible de charger la commande';
        this.isLoading = false;
        console.error('Erreur chargement commande:', err);
      }
    });
  }
  downloadInvoice(): void {
    this.checkoutService.downloadInvoice(this.orderNumber).subscribe({
      next: (blob) => {
        // Vérifier que le blob n'est pas une erreur JSON
        if (blob.type === 'application/json') {
          // C'est une erreur, lire le contenu
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errorResponse = JSON.parse(reader.result as string);
              console.error('Erreur détaillée:', errorResponse);

              // Afficher le message d'erreur spécifique
              const errorMessage = errorResponse.error || errorResponse.message || 'Erreur inconnue';
              alert(`Erreur: ${errorMessage}`);
            } catch (e) {
              console.error('Erreur de parsing JSON:', e);
              alert('Erreur lors du téléchargement de la facture');
            }
          };
          reader.readAsText(blob);
          return;
        }

        // Télécharger le PDF
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Facture_${this.orderNumber}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Erreur téléchargement:', err);

        // Si l'erreur contient déjà un message
        if (err.error && typeof err.error === 'object') {
          const errorMsg = err.error.error || err.error.message || 'Erreur inconnue';
          alert(`Erreur: ${errorMsg}`);
        } else {
          alert('Erreur lors du téléchargement de la facture');
        }
      }
    });
  }

  // sendWhatsApp(): void {
  //   this.checkoutService.getWhatsAppMessage(this.orderNumber).subscribe({
  //     next: (data) => {
  //       const phone = data.telephone || this.order?.livraison?.telephone;
  //       const message = encodeURIComponent(data.message || '');
  //       window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  //     },
  //     error: (err) => {
  //       console.error('Erreur WhatsApp:', err);
  //       alert('Erreur lors de l\'ouverture de WhatsApp');
  //     }
  //   });
  // }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  }
}
