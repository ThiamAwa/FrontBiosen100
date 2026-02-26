import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GammeService } from '../../../services/gamme/gamme.service';
import { Gamme } from '../../../models/gamme';
import { Categorie } from '../../../models/categorie';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-boutique',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './boutique.component.html',
  styleUrls: ['./boutique.component.css']
})
export class BoutiqueComponent implements OnInit, OnDestroy {
  // Données
  gammes: Gamme[] = [];
  categories: Categorie[] = [];

  // Statistiques
  stats = {
    total_gammes: 0,
    gammes_avec_produits: 0,
    total_produits: 0,
    produits_en_promo: 0
  };

  // Pagination
  pagination = {
    current_page: 1,
    last_page: 1,
    per_page: 12,
    total: 0
  };

  // Filtres
  filters = {
    search: '',
    categorie: '',
    prix_max: 50000,
    promo: false,
    tri: 'default',
    page: 1
  };

  // État
  loading = true;
  error = '';
  prixMaxValue = 50000;

  private searchSubject = new Subject<string>();

  constructor(private gammeService: GammeService) {
    // Debounce pour la recherche
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => {
      this.filters.page = 1;
      this.loadGammes();
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadGammes();
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  // ========== CHARGEMENT DES DONNÉES ==========

  loadGammes(): void {
    this.loading = true;

    this.gammeService.getGammesBoutique(
      this.filters.page,
      this.filters.search,
      this.filters.categorie,
      this.filters.prix_max,
      this.filters.tri
    ).subscribe({
      next: (response) => {
        this.gammes = response.data;
        this.pagination = {
          current_page: response.current_page,
          last_page: response.last_page,
          per_page: response.per_page,
          total: response.total
        };

        // Mettre à jour la valeur max du prix
        if (this.gammes.length > 0) {
          const maxPrix = Math.max(...this.gammes.map(g => g.prix));
          this.prixMaxValue = maxPrix > 0 ? maxPrix : 50000;
          if (this.filters.prix_max > this.prixMaxValue) {
            this.filters.prix_max = this.prixMaxValue;
          }
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement gammes:', err);
        this.error = 'Erreur lors du chargement des produits';
        this.loading = false;
      }
    });
  }

  loadCategories(): void {
    this.gammeService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories as Categorie[];
      },
      error: (err) => console.error('Erreur chargement catégories:', err)
    });
  }

  onSearchChange(search: string): void {
    this.filters.search = search;
    this.searchSubject.next(search);
  }

  applyFilters(): void {
    this.filters.page = 1;
    this.loadGammes();
  }

  resetFilters(): void {
    this.filters = {
      search: '',
      categorie: '',
      prix_max: this.prixMaxValue,
      promo: false,
      tri: 'default',
      page: 1
    };
    this.loadGammes();
  }

  updatePrixMax(event: any): void {
    this.filters.prix_max = parseInt(event.target.value);
  }

  // ========== PAGINATION ==========

  getPages(): (number | string)[] {
    const pages: (number | string)[] = [];
    const total = this.pagination.last_page;
    const current = this.pagination.current_page;

    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 3) {
        pages.push(1, 2, 3, 4, '...', total);
      } else if (current >= total - 2) {
        pages.push(1, '...', total - 3, total - 2, total - 1, total);
      } else {
        pages.push(1, '...', current - 1, current, current + 1, '...', total);
      }
    }
    return pages;
  }

// Améliorer changePage pour gérer les nombres uniquement
  changePage(page: number | string): void {
    if (typeof page !== 'number') return;

    if (page >= 1 && page <= this.pagination.last_page) {
      this.filters.page = page;
      this.loadGammes();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ========== MÉTHODES UTILITAIRES ==========

  isCategorieActive(categorieId: string): boolean {
    return this.filters.categorie === categorieId;
  }

  formatPrice(price?: number | null): string {
    return this.gammeService.formatPrice(price);
  }

  calculateDiscount(original: number, promo: number): number {
    return this.gammeService.calculateDiscount(original, promo);
  }

  limitText(text?: string | null): string {
    return this.gammeService.limitText(text, 60);
  }

  getImageUrl(imagePath?: string | null): string {
    return this.gammeService.getImageUrl(imagePath);
  }

  // ========== PANIER ==========

  addToCart(gamme: Gamme): void {
    if (!gamme || gamme.stock <= 0) return;

    try {
      let cart = JSON.parse(localStorage.getItem('biosen_cart') || '[]');

      const price = gamme.enPromotion && gamme.prixPromo ? gamme.prixPromo : gamme.prix;

      const existingItem = cart.find((item: any) => item.id === gamme.id);

      if (existingItem) {
        existingItem.quantity++;
      } else {
        cart.push({
          id: gamme.id,
          name: gamme.nom,
          price: price,
          image: gamme.image,
          category: gamme.type_categorie?.nom || 'Produit',
          quantity: 1
        });
      }

      localStorage.setItem('biosen_cart', JSON.stringify(cart));

      this.showNotification('✅ Produit ajouté au panier');
      this.updateCartCounter();

    } catch (error) {
      console.error('Erreur ajout panier:', error);
    }
  }

  showNotification(message: string): void {
    const notification = document.createElement('div');
    notification.className = 'position-fixed top-0 end-0 m-3 p-3 text-white rounded shadow-lg';
    notification.style.zIndex = '9999';
    notification.style.background = '#287747';
    notification.innerHTML = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.5s';
      setTimeout(() => notification.remove(), 500);
    }, 3000);
  }

  updateCartCounter(): void {
    const cart = JSON.parse(localStorage.getItem('biosen_cart') || '[]');
    const count = cart.reduce((total: number, item: any) => total + item.quantity, 0);

    const cartBadge = document.getElementById('cart-count');
    if (cartBadge) {
      cartBadge.textContent = count.toString();
      cartBadge.style.display = count > 0 ? 'block' : 'none';
    }
  }

  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/img/biosen/default-product.png';
  }
}
