import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../../services/cart/cart.service';
import { CheckoutService } from '../../../services/checkout/checkout.service';
import { AuthService } from '../../../services/auth/auth.service';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  formData = {
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    pays: '',
    adresse: '',
    zone_livraison: '',
    code_postal: '',
    ville: '',
    region: '',
    notes: '',
    create_account: false,
    password: '',
    terms: false
  };

  cart: CartItem[] = [];
  subtotal = 0;
  shippingCost = 0;
  total = 0;

  isLoading = false;
  errors: any = {};
  successMessage = '';

  shippingZones = [
    { value: 'Dakar|Zone 1|1000', label: 'Dakar - Zone 1 (Ouest Foire, Patte d\'Oie) - 1 000 FCFA' },
    { value: 'Dakar|Zone 2|1500', label: 'Dakar - Zone 2 (Yoff, Ngor, Foire) - 1 500 FCFA' },
    { value: 'Dakar|Zone 3|2000', label: 'Dakar - Zone 3 (Liberté, Cité Keur Gorgui) - 2 000 FCFA' },
    { value: 'Dakar|Zone 6|1000', label: 'Dakar - Zone 6 (Beaux Maraîchers) - 1 000 FCFA' },
    { value: 'Rufisque|Zone 4|2500', label: 'Rufisque - Zone 4 - 2 500 FCFA' },
    { value: 'Bargny|Zone 5|3000', label: 'Bargny - Zone 5 - 3 000 FCFA' }
  ];

  countries = [
    { value: 'Senegal', label: '🇸🇳 Sénégal' },
    { value: 'Cote d\'Ivoire', label: '🇨🇮 Côte d\'Ivoire' },
    { value: 'Mali', label: '🇲🇱 Mali' },
    { value: 'Burkina Faso', label: '🇧🇫 Burkina Faso' },
    { value: 'France', label: '🇫🇷 France' },
    { value: 'Belgique', label: '🇧🇪 Belgique' },
    { value: 'Canada', label: '🇨🇦 Canada' },
    { value: 'USA', label: '🇺🇸 États-Unis' },
    { value: 'Autre', label: '🌍 Autre pays' }
  ];

  constructor(
    private checkoutService: CheckoutService,
    private cartService: CartService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCart();
    this.prefillUserData();
  }

  prefillUserData(): void {
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.formData.nom = currentUser.nom || '';
      this.formData.prenom = currentUser.prenom || '';
      this.formData.email = currentUser.email || '';
      this.formData.telephone = currentUser.telephone || '';
      this.formData.create_account = false;
    }
  }

  loadCart(): void {
    this.cart = this.cartService.getCart();
    this.calculateTotals();
    if (this.cart.length === 0) {
      this.router.navigate(['/boutique']);
    }
  }

  calculateTotals(): void {
    this.subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    this.updateTotal();
  }

  updateTotal(): void {
    this.total = this.subtotal + this.shippingCost;
  }

  onShippingZoneChange(): void {
    if (this.formData.zone_livraison) {
      const parts = this.formData.zone_livraison.split('|');
      this.shippingCost = parseInt(parts[2]) || 0;
      this.updateTotal();
    }
  }

  onCountryChange(): void {
    if (this.formData.pays !== 'Senegal') {
      this.formData.zone_livraison = '';
      this.shippingCost = 0;
      this.updateTotal();
    }
  }

  toggleAccountFields(): void {
    if (!this.formData.create_account) {
      this.formData.password = '';
    }
  }

  validateForm(): boolean {
    this.errors = {};

    if (!this.formData.nom) this.errors.nom = 'Le nom est requis';
    if (!this.formData.prenom) this.errors.prenom = 'Le prénom est requis';
    if (!this.formData.telephone) this.errors.telephone = 'Le téléphone est requis';
    if (!this.formData.pays) this.errors.pays = 'Le pays est requis';
    if (!this.formData.adresse) this.errors.adresse = 'L\'adresse est requise';

    if (this.formData.pays === 'Senegal') {
      if (!this.formData.zone_livraison) {
        this.errors.zone_livraison = 'La zone de livraison est requise';
      }
    } else if (this.formData.pays) {
      if (!this.formData.code_postal) this.errors.code_postal = 'Le code postal est requis';
      if (!this.formData.ville) this.errors.ville = 'La ville est requise';
      if (!this.formData.region) this.errors.region = 'La région est requise';
    }

    if (!this.authService.currentUser()) {
      if (this.formData.create_account) {
        if (!this.formData.email) this.errors.email = 'L\'email est requis pour créer un compte';
        if (!this.formData.password) this.errors.password = 'Le mot de passe est requis';
      }
    }

    if (!this.formData.terms) this.errors.terms = 'Vous devez accepter les conditions';

    return Object.keys(this.errors).length === 0;
  }

  /**
   * Soumettre la commande
   * La fenêtre est ouverte AVANT le await pour que le mobile l'autorise
   */
  async onSubmit(): Promise<void> {
    if (!this.validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    this.isLoading = true;
    this.errors = {};

    const whatsappWindow = window.open('', '_blank');

    try {
      const orderData: any = {
        ...this.formData,
        cart_data: JSON.stringify(this.cart),
        shipping_cost: this.shippingCost
      };

      if (this.authService.currentUser()) {
        delete orderData.password;
        orderData.create_account = false;
      }

      const response = await this.checkoutService.submitOrder(orderData).toPromise();

      if (response && response.order_number) {
        this.cartService.clearCart();

        // ✅ Rediriger la fenêtre déjà ouverte (pas de nouvelle popup bloquée)
        const whatsappUrl = this.buildWhatsAppUrl(response.order_number);
        if (whatsappWindow) {
          whatsappWindow.location.href = whatsappUrl;
        }

        this.router.navigate(['/checkout/confirmation', response.order_number]);
      } else {
        whatsappWindow?.close();
        throw new Error('Réponse invalide du serveur');
      }

    } catch (error: any) {
      whatsappWindow?.close();
      if (error.status === 422 && error.error?.errors) {
        this.errors = error.error.errors;
      } else {
        this.errors.general = error.error?.message || error.message || 'Une erreur est survenue';
      }
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Construire l'URL WhatsApp — utilisée par onSubmit()
   */
  buildWhatsAppUrl(orderNumber: string): string {
    const vendeurTel = '221782007936';

    let lignesProduits = '';
    this.cart.forEach((item, index) => {
      lignesProduits += `\n${index + 1}. ${item.name}`;
      lignesProduits += `\n   Qté: ${item.quantity}  |  Prix: ${this.formatPrice(item.price)}`;
      lignesProduits += `\n   Sous-total: *${this.formatPrice(item.price * item.quantity)}*`;
      lignesProduits += '\n';
    });

    const zoneParts = this.formData.zone_livraison?.split('|') || [];
    const zoneLabel = zoneParts.length >= 2
      ? `${zoneParts[0]} - ${zoneParts[1]}`
      : this.formData.pays;

    const message =
` *BIOSEN 100 — COMMANDE* 

*N° Commande :* ${orderNumber}
*Date :* ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}

*INFORMATIONS CLIENT*

- Nom complet : *${this.formData.prenom} ${this.formData.nom}*
- Téléphone : *${this.formData.telephone}*
- Adresse : ${this.formData.adresse}
- Pays : ${this.formData.pays}
- Zone : ${zoneLabel}
${this.formData.notes ? `• Note : _${this.formData.notes}_` : ''}

*PRODUITS COMMANDÉS*

${lignesProduits}

*RÉCAPITULATIF*

- Sous-total : ${this.formatPrice(this.subtotal)}
- Livraison  : ${this.formatPrice(this.shippingCost)}

*TOTAL À PAYER : ${this.formatPrice(this.total)}*

*PAIEMENT*

Veuillez effectuer le paiement via :
- *Wave*
- *Orange Money*
- *Free Money*

Puis envoyez la capture de paiement ici 

_— BioSen 100_`;

    return `https://wa.me/${vendeurTel}?text=${encodeURIComponent(message)}`;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  }

  isInvalid(field: string): boolean {
    return !!this.errors[field];
  }
}