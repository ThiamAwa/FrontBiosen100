import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GammeService } from '../../../services/gamme/gamme.service';
import { Gamme } from '../../../models/gamme';
import { Categorie } from '../../../models/categorie';
import { Subject, debounceTime, distinctUntilChanged, forkJoin } from 'rxjs';
import { ProduitSportService } from '../../../services/produit-sport/produit-sport.service';
import { CartService, CartItem } from '../../../services/cart/cart.service';

declare var bootstrap: any;

@Component({
  selector: 'app-boutique',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './boutique.component.html',
  styleUrls: ['./boutique.component.css']
})
export class BoutiqueComponent implements OnInit, OnDestroy {

  // ─── Données ───────────────────────────────────────────────
  gammes: Gamme[] = [];
  categories: Categorie[] = [];
  produitsSport: any[] = [];

  typeCategories: { id: number; nom: string; count: number; isSport: boolean }[] = [];
  categoriesSport: { id: number; nom: string; count: number }[] = [];
  totalAllProducts = 0;

  private sportTypeId = '2';

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
    type_categorie: '',
    categorie_sport: '',
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

  constructor(
    private gammeService: GammeService,
    private produitSportService: ProduitSportService,
    public cartService: CartService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => {
      this.filters.page = 1;
      this.loadProducts();
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  // ══════════════════════════════════════════════════════════
  // Getters
  // ══════════════════════════════════════════════════════════

  get isAllSelected(): boolean {
    return this.filters.type_categorie === '';
  }

  get isSportSelected(): boolean {
    if (this.isAllSelected) return false;
    const selected = this.typeCategories.find(
      t => t.id.toString() === this.filters.type_categorie
    );
    return selected?.isSport ?? false;
  }

  get isBioSelected(): boolean {
    return !this.isAllSelected && !this.isSportSelected;
  }

  // ══════════════════════════════════════════════════════════
  // Panier — Getters réactifs
  // ══════════════════════════════════════════════════════════

  get cartItems(): CartItem[] {
    return this.cartService.getCart();
  }

  get cartSubtotal(): number {
    return this.cartService.getCartTotal();
  }

  get cartCount(): number {
    return this.cartService.getCartCount();
  }

  // ══════════════════════════════════════════════════════════
  // Chargement principal
  // ══════════════════════════════════════════════════════════

  loadProducts(): void {
    this.loading = true;
    this.error = '';

    if (this.isAllSelected) {
      this.loadAll();
    } else if (this.isSportSelected) {
      this.gammes = [];
      this.loadProduitsSport();
    } else {
      this.produitsSport = [];
      this.loadGammes();
    }
  }

  loadAll(): void {
    forkJoin({
      gammes: this.gammeService.getGammesBoutique(
        this.filters.page,
        this.filters.search,
        '',
        this.filters.prix_max,
        this.filters.tri
      ),
      sport: this.produitSportService.getProduitsWithFilters({
        page: this.filters.page
      })
    }).subscribe({
      next: ({ gammes, sport }) => {
        this.gammes = gammes.data;
        this.produitsSport = sport.produits?.data || [];
        this.pagination = {
          current_page: gammes.current_page,
          last_page: gammes.last_page,
          per_page: gammes.per_page,
          total: gammes.total + (sport.produits?.total || 0)
        };
        this.updatePrixMaxValue();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement tous produits:', err);
        this.error = 'Erreur lors du chargement des produits';
        this.loading = false;
      }
    });
  }

  loadGammes(): void {
    this.gammeService.getGammesBoutique(
      this.filters.page,
      this.filters.search,
      this.filters.type_categorie,
      this.filters.prix_max,
      this.filters.tri
    ).subscribe({
      next: (response) => {
        this.gammes = response.data;
        this.produitsSport = [];
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

  loadProduitsSport(): void {
    const params: {
      page: number;
      search?: string;
      categorie?: number;
      prix_max?: number;
      en_promotion?: boolean;
      sort?: string;
    } = { page: this.filters.page };

    if (this.filters.categorie_sport) params.categorie = parseInt(this.filters.categorie_sport);
    if (this.filters.prix_max && this.filters.prix_max < this.prixMaxValue) params.prix_max = this.filters.prix_max;
    if (this.filters.promo) params.en_promotion = true;
    if (this.filters.tri !== 'default') params.sort = this.filters.tri;

    this.produitSportService.getProduitsWithFilters(params).subscribe({
      next: (response) => {
        this.produitsSport = response.produits?.data || [];
        this.gammes = [];
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

  // ══════════════════════════════════════════════════════════
  // Catégories
  // ══════════════════════════════════════════════════════════

  loadCategories(): void {
    this.gammeService.getCategories(1).subscribe({
      next: (response) => {
        const categoriesData = response.data;
        const totalCounts = new Map<number, number>();
        categoriesData.forEach((cat: any) => {
          if (cat.type_categorie) {
            const typeId = cat.type_categorie.id;
            totalCounts.set(typeId, (totalCounts.get(typeId) || 0) + (cat.produits_count || 0));
          }
        });

        this.produitSportService.getProduitsWithFilters({ page: 1 }).subscribe({
          next: (sportResponse) => {
            const sportCount = sportResponse.produits?.total || 0;
            const typeMap = new Map<number, { id: number; nom: string; count: number; isSport: boolean }>();

            categoriesData.forEach((cat: any) => {
              if (cat.type_categorie) {
                const typeId = cat.type_categorie.id;
                const nom: string = cat.type_categorie.nom ?? '';
                if (!typeMap.has(typeId)) {
                  const isSport = nom.toLowerCase().includes('sport') || typeId.toString() === this.sportTypeId;
                  typeMap.set(typeId, {
                    id: typeId,
                    nom,
                    count: isSport ? sportCount : (totalCounts.get(typeId) || 0),
                    isSport
                  });
                  if (isSport) this.sportTypeId = typeId.toString();
                }
              }
            });

            this.typeCategories = Array.from(typeMap.values());
            this.totalAllProducts = this.typeCategories.reduce((sum, t) => sum + t.count, 0);
            this.categoriesSport = categoriesData
              .filter((cat: any) => cat.type_categorie?.id.toString() === this.sportTypeId)
              .map((cat: any) => ({ id: cat.id, nom: cat.nom, count: cat.produits_count || 0 }));
          },
          error: () => {
            this.typeCategories = Array.from(
              new Map(
                categoriesData
                  .filter((cat: any) => cat.type_categorie)
                  .map((cat: any) => [
                    cat.type_categorie.id,
                    {
                      id: cat.type_categorie.id,
                      nom: cat.type_categorie.nom,
                      count: totalCounts.get(cat.type_categorie.id) || 0,
                      isSport: cat.type_categorie.id.toString() === this.sportTypeId
                    }
                  ])
              ).values()
            );
            this.totalAllProducts = this.typeCategories.reduce((sum, t) => sum + t.count, 0);
          }
        });
      },
      error: (err) => {
        console.error('Erreur chargement catégories:', err);
        this.typeCategories = [];
      }
    });
  }

  // ══════════════════════════════════════════════════════════
  // Items affichés
  // ══════════════════════════════════════════════════════════

  get currentDisplayedCount(): number {
    return this.gammes.length + this.produitsSport.length;
  }

  get displayedItems(): any[] {
    if (this.isAllSelected) return [...this.gammes, ...this.produitsSport];
    if (this.isSportSelected) return this.produitsSport;
    return this.gammes;
  }

  isItemSport(item: any): boolean {
    return Array.isArray(item.imageUrls);
  }

  // ══════════════════════════════════════════════════════════
  // Image & route
  // ══════════════════════════════════════════════════════════

  getItemImage(item: any): string {
    if (item.imageUrls && Array.isArray(item.imageUrls) && item.imageUrls.length > 0) {
      return item.imageUrls[0];
    }
    if (item.image && typeof item.image === 'string') {
      return this.getImageUrl(item.image);
    }
    return 'assets/img/placeholder.jpeg';
  }

  getItemRoute(item: any): string {
    return this.isItemSport(item) ? 'produit-sport' : 'gamme';
  }

  getItemBadgeLabel(item: any): string {
    if (this.isItemSport(item)) return 'Sport';
    return item.type_categorie?.nom ?? item.typeCategorie?.nom ?? 'Bio';
  }

  // ══════════════════════════════════════════════════════════
  // Prix max (slider)
  // ══════════════════════════════════════════════════════════

  updatePrixMaxValue(): void {
    const items = this.displayedItems;
    if (items.length > 0) {
      const maxPrix = Math.max(...items.map(item => item.prix ?? 0));
      this.prixMaxValue = maxPrix > 0 ? maxPrix : 50000;
      if (this.filters.prix_max > this.prixMaxValue) this.filters.prix_max = this.prixMaxValue;
    }
  }

  // ══════════════════════════════════════════════════════════
  // Filtres
  // ══════════════════════════════════════════════════════════

  onSearchChange(search: string): void {
    this.filters.search = search;
    this.searchSubject.next(search);
  }

  applyFilters(): void {
    this.filters.page = 1;
    this.loadProducts();
  }

  filterByTypeCategorie(typeId: string): void {
    this.filters.type_categorie = typeId;
    this.filters.categorie_sport = '';
    this.filters.page = 1;
    this.loadProducts();
  }

  filterBySousCategoriesSport(categorieId: string): void {
    this.filters.categorie_sport = this.filters.categorie_sport === categorieId ? '' : categorieId;
    this.filters.page = 1;
    this.loadProduitsSport();
  }

  resetFilters(): void {
    this.filters = {
      search: '',
      categorie: '',
      type_categorie: '',
      categorie_sport: '',
      prix_max: this.prixMaxValue,
      promo: false,
      tri: 'default',
      page: 1
    };
    this.loadProducts();
  }

  updatePrixMax(event: any): void {
    this.filters.prix_max = parseInt(event.target.value);
  }

  // ══════════════════════════════════════════════════════════
  // Pagination
  // ══════════════════════════════════════════════════════════

  getPages(): (number | string)[] {
    const pages: (number | string)[] = [];
    const total = this.pagination.last_page;
    const current = this.pagination.current_page;
    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 3) pages.push(1, 2, 3, 4, '...', total);
      else if (current >= total - 2) pages.push(1, '...', total - 3, total - 2, total - 1, total);
      else pages.push(1, '...', current - 1, current, current + 1, '...', total);
    }
    return pages;
  }

  changePage(page: number | string): void {
    if (typeof page !== 'number') return;
    if (page >= 1 && page <= this.pagination.last_page) {
      this.filters.page = page;
      this.loadProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ══════════════════════════════════════════════════════════
  // Utilitaires
  // ══════════════════════════════════════════════════════════

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

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.onerror = null;
    img.src = 'assets/img/placeholder.jpeg';
  }

  // ══════════════════════════════════════════════════════════
  // Panier — Actions
  // ══════════════════════════════════════════════════════════

  addToCart(item: any): void {
    if (!item || item.stock <= 0) return;

    const prix = item.enPromotion && item.prixPromo ? item.prixPromo : item.prix;

    this.cartService.addToCart({
      id: item.id,
      name: item.nom,
      price: prix,
      quantity: 1,
      image: this.getItemImage(item),
      category: this.getItemBadgeLabel(item),
      description: item.description ?? ''
    });

    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        if (typeof bootstrap !== 'undefined') {
          const cartModalEl = document.getElementById('cartModal');
          if (cartModalEl) bootstrap.Modal.getOrCreateInstance(cartModalEl).show();
        }
      }, 100);
    }
  }

  increaseQuantity(item: CartItem): void {
    this.cartService.incrementQuantity(item.id);
  }

  decreaseQuantity(item: CartItem): void {
    this.cartService.decrementQuantity(item.id);
  }

  removeFromCart(id: number): void {
    this.cartService.removeFromCart(id);
  }

  clearCart(): void {
    this.cartService.clearCart();
  }

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

  getCartItemImage(item: CartItem): string {
    return item.image?.trim() ? item.image : '';
  }

  openCartModal(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        if (typeof bootstrap !== 'undefined') {
          const cartModalEl = document.getElementById('cartModal');
          if (cartModalEl) bootstrap.Modal.getOrCreateInstance(cartModalEl).show();
        }
      }, 100);
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
}