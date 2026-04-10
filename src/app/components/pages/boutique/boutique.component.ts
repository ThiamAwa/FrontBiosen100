import { Component, OnInit, OnDestroy, HostListener, Inject, PLATFORM_ID } from '@angular/core';
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

  // ─── Données produits ────────────────────────────────────
  gammes: Gamme[] = [];
  categories: Categorie[] = [];
  produitsSport: any[] = [];

  // ─── Best sellers : exactement 2 produits ───────────────
  bestSellers: any[] = [];

  // ─── Catégories ─────────────────────────────────────────
  typeCategories: { id: number; nom: string; count: number; isSport: boolean }[] = [];
  categoriesSport: { id: number; nom: string; count: number }[] = [];
  totalAllProducts = 0;

  /**
   * Catégories "objectif" (Bio, Perte, Prise…) — hors Sport
   * Affichées dans les pills "Parcourir par objectif"
   */
  quickCategoriesBio: { id: number; nom: string; icon: string; count: number }[] = [];

  /**
   * Catégorie Sport unique — affichée séparément dans les pills
   * avec ses sous-catégories dépliables
   */
  quickCategorySport: { id: number; nom: string; count: number } | null = null;

  private sportTypeId = '2';

  // ─── Pagination ──────────────────────────────────────────
  pagination = {
    current_page: 1,
    last_page: 1,
    per_page: 12,
    total: 0
  };

  // ─── Filtres ─────────────────────────────────────────────
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

  // ─── État ────────────────────────────────────────────────
  loading = true;
  error = '';
  prixMaxValue = 50000;

  // ─── Responsive sidebar ──────────────────────────────────
  sidebarOpen = false;
  isMobile = false;

  private searchSubject = new Subject<string>();
  private prixSubject = new Subject<number>();

  constructor(
    private gammeService: GammeService,
    private produitSportService: ProduitSportService,
    public cartService: CartService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.searchSubject.pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => { this.filters.page = 1; this.loadProducts(); });

    this.prixSubject.pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => { this.filters.page = 1; this.loadProducts(); });
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile = window.innerWidth < 992;
    }
    this.loadCategories();
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
    this.prixSubject.complete();
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
  }

  // ══════════════════════════════════════════════════════════
  // Responsive — Sidebar drawer
  // ══════════════════════════════════════════════════════════

  @HostListener('window:resize')
  onResize(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile = window.innerWidth < 992;
      if (!this.isMobile && this.sidebarOpen) {
        this.sidebarOpen = false;
        document.body.style.overflow = '';
      }
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = this.sidebarOpen ? 'hidden' : '';
    }
  }

  get activeFiltersCount(): number {
    let count = 0;
    if (this.filters.promo) count++;
    if (this.filters.prix_max < this.prixMaxValue) count++;
    if (this.filters.search && this.filters.search.trim() !== '') count++;
    if (this.filters.categorie_sport) count++;
    return count;
  }

  // ══════════════════════════════════════════════════════════
  // Getters
  // ══════════════════════════════════════════════════════════

  get isAllSelected(): boolean {
    return this.filters.type_categorie === '';
  }

  get isSportSelected(): boolean {
    if (this.isAllSelected) return false;
    return this.typeCategories.find(
      t => t.id.toString() === this.filters.type_categorie
    )?.isSport ?? false;
  }

  get isBioSelected(): boolean {
    return !this.isAllSelected && !this.isSportSelected;
  }

  /** Nom de la catégorie active affiché au-dessus de la grille */
  get activeCategoryName(): string {
    if (this.isAllSelected) return '';
    const cat = this.typeCategories.find(t => t.id.toString() === this.filters.type_categorie);
    return cat?.nom ?? '';
  }

  get cartItems(): CartItem[] { return this.cartService.getCart(); }
  get cartSubtotal(): number { return this.cartService.getCartTotal(); }
  get cartCount(): number { return this.cartService.getCartCount(); }

  // ══════════════════════════════════════════════════════════
  // Chargement principal
  // ══════════════════════════════════════════════════════════

  loadProducts(): void {
    this.loading = true;
    this.error = '';

    if (this.filters.promo) {
      this.loadPromo();
      return;
    }

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

  // ──────────────────────────────────────────────────────────
  loadPromo(): void {
    forkJoin({
      gammes: this.gammeService.getGammesBoutique(
        this.filters.page, this.filters.search, '',
        this.filters.prix_max, this.filters.tri, true
      ),
      sport: this.produitSportService.getProduitsWithFilters({
        page: this.filters.page,
        en_promotion: true,
        ...(this.filters.search && { search: this.filters.search }),
        ...(this.filters.prix_max < this.prixMaxValue && { prix_max: this.filters.prix_max }),
        ...(this.filters.tri !== 'default' && { sort: this.filters.tri })
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
        console.error('Erreur chargement promo:', err);
        this.error = 'Erreur lors du chargement des promotions';
        this.loading = false;
      }
    });
  }

  // ──────────────────────────────────────────────────────────
  loadAll(): void {
    forkJoin({
      gammes: this.gammeService.getGammesBoutique(
        this.filters.page, this.filters.search, '',
        this.filters.prix_max, this.filters.tri, false
      ),
      sport: this.produitSportService.getProduitsWithFilters({
        page: this.filters.page,
        ...(this.filters.search && { search: this.filters.search }),
        ...(this.filters.prix_max < this.prixMaxValue && { prix_max: this.filters.prix_max }),
        ...(this.filters.tri !== 'default' && { sort: this.filters.tri })
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

        // Construire les best sellers uniquement au premier chargement
        if (this.bestSellers.length === 0) {
          this.buildBestSellers();
        }

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
      this.filters.page, this.filters.search, this.filters.type_categorie,
      this.filters.prix_max, this.filters.tri, false
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

    if (this.filters.search) params.search = this.filters.search;
    if (this.filters.categorie_sport) params.categorie = parseInt(this.filters.categorie_sport);
    if (this.filters.prix_max < this.prixMaxValue) params.prix_max = this.filters.prix_max;
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
  // Best Sellers — exactement 2 produits
  // ══════════════════════════════════════════════════════════

  /**
   * Sélectionne les 2 meilleurs produits à mettre en avant.
   * Règle de priorité :
   *   1. Produits en promotion avec stock disponible
   *   2. Produits avec stock disponible (tous types)
   * On garde exactement 2 produits.
   */
  buildBestSellers(): void {
    const allProducts = [...this.gammes, ...this.produitsSport];

    const enPromo = allProducts.filter(p => p.enPromotion && p.prixPromo && p.stock > 0);
    const enStock = allProducts.filter(p => !(p.enPromotion && p.prixPromo) && p.stock > 0);

    const candidates = [...enPromo, ...enStock];

    // On prend exactement 2 — si moins de 2 produits dispo, on prend ce qu'on a
    this.bestSellers = candidates.slice(0, 2);
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

            // Construire les pills rapides
            this.buildQuickCategories();
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
            this.buildQuickCategories();
          }
        });
      },
      error: (err) => {
        console.error('Erreur chargement catégories:', err);
        this.typeCategories = [];
      }
    });
  }

  /**
   * Sépare les catégories en deux groupes :
   *  - quickCategoriesBio  : toutes les catégories NON sport (avec icône selon le nom)
   *  - quickCategorySport  : la catégorie sport unique (mis en valeur séparément dans la vue)
   */
  buildQuickCategories(): void {
    this.quickCategoriesBio = this.typeCategories
      .filter(t => !t.isSport)
      .map(t => ({
        id: t.id,
        nom: t.nom,
        count: t.count,
        icon: this.getCategoryIcon(t.nom)
      }));

    const sportCat = this.typeCategories.find(t => t.isSport);
    this.quickCategorySport = sportCat
      ? { id: sportCat.id, nom: sportCat.nom, count: sportCat.count }
      : null;
  }

  /**
   * Choisit l'icône Font Awesome adaptée au nom de la catégorie.
   */
  getCategoryIcon(nom: string): string {
    const n = nom.toLowerCase();

    if (n.includes('perte') || n.includes('minceur') || n.includes('slim') || n.includes('détox') || n.includes('detox')) {
      return 'fas fa-arrow-trend-down';
    }
    if (n.includes('prise') || n.includes('masse') || n.includes('gain') || n.includes('muscu') || n.includes('bulk')) {
      return 'fas fa-arrow-trend-up';
    }
    if (n.includes('energie') || n.includes('énergie') || n.includes('vitalit')) {
      return 'fas fa-bolt';
    }
    if (n.includes('beaut') || n.includes('soin') || n.includes('peau') || n.includes('anti')) {
      return 'fas fa-spa';
    }
    if (n.includes('bien') || n.includes('sant') || n.includes('immunit')) {
      return 'fas fa-heart';
    }
    if (n.includes('digesti') || n.includes('intestin')) {
      return 'fas fa-seedling';
    }
    if (n.includes('stress') || n.includes('sommeil') || n.includes('relax')) {
      return 'fas fa-moon';
    }

    return 'fas fa-leaf';
  }

  // ══════════════════════════════════════════════════════════
  // Items affichés
  // ══════════════════════════════════════════════════════════

  get currentDisplayedCount(): number {
    return this.gammes.length + this.produitsSport.length;
  }

  get displayedItems(): any[] {
    if (this.filters.promo) return [...this.gammes, ...this.produitsSport];
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
    return this.isItemSport(item) ? 'sport' : 'gamme';
  }

  goToDetail(item: any): void {
    if (this.isItemSport(item)) {
      this.router.navigate(['/sport', item.id]);
    } else {
      this.router.navigate(['/gamme', item.id]);
    }
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
      if (this.filters.prix_max > this.prixMaxValue) {
        this.filters.prix_max = this.prixMaxValue;
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  // Filtres
  // ══════════════════════════════════════════════════════════

  onSearchChange(search: string): void {
    this.filters.search = search;
    this.searchSubject.next(search);
  }

  updatePrixMax(event: any): void {
    this.filters.prix_max = parseInt(event.target.value, 10);
    this.prixSubject.next(this.filters.prix_max);
  }

  applyFilters(): void {
    this.filters.page = 1;
    this.loadProducts();
  }

  filterByTypeCategorie(typeId: string): void {
    this.filters.type_categorie = typeId;
    this.filters.categorie_sport = '';
    this.filters.page = 1;
    if (this.isMobile && this.sidebarOpen) {
      this.toggleSidebar();
    }
    this.loadProducts();
  }

  filterBySousCategoriesSport(categorieId: string): void {
    // Toggle : cliquer à nouveau sur la même sous-cat la désélectionne
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
      if (isPlatformBrowser(this.platformId)) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
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

  increaseQuantity(item: CartItem): void { this.cartService.incrementQuantity(item.id); }
  decreaseQuantity(item: CartItem): void { this.cartService.decrementQuantity(item.id); }
  removeFromCart(id: number): void { this.cartService.removeFromCart(id); }
  clearCart(): void { this.cartService.clearCart(); }

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
    if (!isPlatformBrowser(this.platformId)) return;
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