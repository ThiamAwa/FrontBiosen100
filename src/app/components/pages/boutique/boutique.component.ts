import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GammeService } from '../../../services/gamme/gamme.service';
import { Gamme } from '../../../models/gamme';
import { Categorie } from '../../../models/categorie';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import {ProduitSportService} from '../../../services/produit-sport/produit-sport.service';

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
  produitsSport: any[] = [];
  typeCategories: { id: number; nom: string; count: number }[] = [];
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
    type_categorie: '1',
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

  constructor(private gammeService: GammeService, private produitSportService: ProduitSportService) {
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

  // Dans boutique.component.ts

  loadGammes(): void {
    this.loading = true;

    // Si type_categorie = '2' (Sport), charger les produits sport
    if (this.filters.type_categorie === '2') {
      this.loadProduitsSport();
    } else {
      // Sinon (Bio ou Tous), charger les gammes
      this.gammeService.getGammesBoutique(
        this.filters.page,
        this.filters.search,
        this.filters.type_categorie,
        this.filters.prix_max,
        this.filters.tri
      ).subscribe({
        next: (response) => {
          this.gammes = response.data;
          this.produitsSport = []; // Vider les produits sport
          this.pagination = {
            current_page: response.current_page,
            last_page: response.last_page,
            per_page: response.per_page,
            total: response.total
          };

          this.updatePrixMaxValue();
          this.loading = false;
        },
        error: (err) => {
          console.error('Erreur chargement gammes:', err);
          this.error = 'Erreur lors du chargement des produits';
          this.loading = false;
        }
      });
    }
  }

  // Dans boutique.component.ts - Modifier loadProduitsSport()

  loadProduitsSport(): void {
    this.produitSportService.getProduits(this.filters.page).subscribe({
      next: (response) => {
        // La réponse est de type ProduitSportResponse avec une structure { produits: { data: [...] } }
        this.produitsSport = response.produits?.data || [];
        this.gammes = []; // Vider les gammes

        // Utiliser les infos de pagination depuis response.produits
        this.pagination = {
          current_page: response.produits?.current_page || 1,
          last_page: response.produits?.last_page || 1,
          per_page: response.produits?.per_page || 12,
          total: response.produits?.total || 0
        };

        this.updatePrixMaxValue();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement produits sport:', err);
        this.error = 'Erreur lors du chargement des produits sport';
        this.loading = false;
      }
    });
  }

// Méthode utilitaire pour mettre à jour la valeur max du prix
  updatePrixMaxValue(): void {
    const items = this.filters.type_categorie === '2' ? this.produitsSport : this.gammes;

    if (items.length > 0) {
      const maxPrix = Math.max(...items.map(item => item.prix));
      this.prixMaxValue = maxPrix > 0 ? maxPrix : 50000;
      if (this.filters.prix_max > this.prixMaxValue) {
        this.filters.prix_max = this.prixMaxValue;
      }
    }
  }
  loadCategories(): void {
    this.gammeService.getCategories(1).subscribe({
      next: (response) => {
        const categoriesData = response.data;

        //  NE PAS toucher à this.categories
        // this.categories = categoriesData; // Si tu veux garder les catégories originales

        // Calculer les types de catégories avec compteurs
        const typeMap = new Map<number, { id: number; nom: string; count: number }>();

        categoriesData.forEach((cat: any) => {
          if (cat.type_categorie) {
            const typeId = cat.type_categorie.id;
            if (!typeMap.has(typeId)) {
              typeMap.set(typeId, {
                id: typeId,
                nom: cat.type_categorie.nom,
                count: 0
              });
            }
            if (cat.produits_count) {
              const current = typeMap.get(typeId)!;
              current.count += cat.produits_count;
            }
          }
        });

        //  Utiliser typeCategories au lieu de categories
        this.typeCategories = Array.from(typeMap.values());
        console.log('Types de catégories avec compteurs:', this.typeCategories);
      },
      error: (err) => {
        console.error('Erreur chargement catégories:', err);
        this.typeCategories = [];
      }
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

  filterByTypeCategorie(typeId: string): void {
    this.filters.type_categorie = typeId;
    this.filters.page = 1;
    this.loadGammes();
  }

  resetFilters(): void {
    this.filters = {
      search: '',
      categorie: '',
      type_categorie: '1',
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
    return this.filters.type_categorie === categorieId;
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
      this.showNotification(' Produit ajouté au panier');
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
