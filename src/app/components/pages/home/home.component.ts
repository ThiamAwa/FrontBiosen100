import { Component, OnInit, AfterViewInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HomeService } from '../../../services/home/home.service';
import { TemoignageService } from '../../../services/temoignage/temoignage.service';
import { ProduitSportService, ProduitSportResponse } from '../../../services/produit-sport/produit-sport.service';
import { CartService, CartItem } from '../../../services/cart/cart.service';
import { Produit } from '../../../models/produit';
import { AccueilData } from '../../../models/accueilData';
import { Gamme } from '../../../models/gamme';
import { Vendeur } from '../../../models/vendeur';
import { Temoignage } from '../../../models/temoignage';
import { ProduitSport } from '../../../models/produit-sport';

declare var $: any;
declare var AOS: any;
declare var bootstrap: any;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {

  // ─── Données ───────────────────────────────────────────────
  data: AccueilData | null = null;
  produits: Produit[] = [];
  produitsPromo: Produit[] = [];
  gammes: Gamme[] = [];
  categories: any[] = [];
  typeCategories: any[] = [];
  produitsSport: ProduitSport[] = [];
  vendeurs: Vendeur[] = [];
  temoignages: Temoignage[] = [];
  stats: any = {
    total_produits: 0,
    total_gammes: 0,
    total_categories: 0,
    produits_promo: 0
  };

  // ─── États UI ──────────────────────────────────────────────
  loading = true;
  loadingTemoignages = false;
  error = '';
  searchQuery = '';
  newsletterEmail = '';
  currentYear = new Date().getFullYear();

  // ─── Onglets ───────────────────────────────────────────────
  activeTab = 'all';
  activeGammeTab = 'all';

  // ─── Modal vidéo ──────────────────────────────────────────
  showVideoModal = false;
  currentVideoUrl: SafeResourceUrl | null = null;
  currentVideoExternalUrl = '';

  // ─── Lightbox photo ───────────────────────────────────────
  showLightbox = false;
  currentImageUrl = '';

  // ─── Modales produits ──────────────────────────────────────
  selectedGamme: Gamme | null = null;
  selectedSport: ProduitSport | null = null;

  // ─── Références internes ───────────────────────────────────
  private carouselInitialized = false;
  private gammeSwiper: any = null;
  private observer: IntersectionObserver | null = null;
  private sportSwiper: any = null;

  constructor(
    private accueilService: HomeService,
    private temoignageService: TemoignageService,
    private produitSportService: ProduitSportService,
    private cartService: CartService,
    private sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  // ══════════════════════════════════════════════════════════
  // Cycle de vie
  // ══════════════════════════════════════════════════════════

  ngOnInit(): void {
    this.loadData();
    this.loadTemoignages();
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    setTimeout(() => {
      if (typeof bootstrap !== 'undefined') {
        const carouselElement = document.getElementById('carouselId');
        if (carouselElement) {
          new bootstrap.Carousel(carouselElement, { interval: 3000, ride: 'carousel' });
        }
      }
    }, 500);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.destroySwiper();
  }

  // ══════════════════════════════════════════════════════════
  // Chargement des données
  // ══════════════════════════════════════════════════════════

  loadData(): void {
    this.loading = true;
    this.accueilService.getAccueilData().subscribe({
      next: (response) => {
        console.log('Réponse API accueil :', response);
        this.data = response;
        this.produits = response.produits || [];
        this.produitsPromo = response.produitsPromo || [];
        this.gammes = response.gammes || [];
        this.categories = response.categories || [];
        this.typeCategories = response.typeCategories || [];
        this.vendeurs = response.vendeurs || [];
        this.stats = response.stats || this.stats;
        this.loading = false;
        this.loadProduitsSport();
        setTimeout(() => this.initLibraries(), 800);
      },
      error: (err) => {
        console.error('Erreur chargement accueil:', err);
        this.error = 'Erreur lors du chargement de la page';
        this.loading = false;
      }
    });
  }

  loadProduitsSport(): void {
    this.produitSportService.getProduitsWithFilters({ page: 1 }).subscribe({
      next: (sportResponse: ProduitSportResponse) => {
        this.produitsSport = sportResponse.produits.data.map(p => ({
          ...p,
          imageUrls: p.imageUrls || [],
          typeCategorie: p.typeCategorie || null,
        }));
        console.log('Produits sport chargés :', this.produitsSport);
        setTimeout(() => this.initSwiper(), 300);
      },
      error: (err) => {
        console.error('Erreur chargement produits sport:', err);
      }
    });
  }

  loadTemoignages(): void {
    this.loadingTemoignages = true;
    this.temoignageService.getTemoignagesPublics().subscribe({
      next: (data) => {
        this.temoignages = data.slice(0, 3);
        this.loadingTemoignages = false;
      },
      error: (err) => {
        console.error('Erreur chargement témoignages:', err);
        this.loadingTemoignages = false;
      }
    });
  }

  // ══════════════════════════════════════════════════════════
  // Panier
  // ══════════════════════════════════════════════════════════

  addToCart(produit: any, event?: Event): void {
    if (event) event.stopPropagation();

    const isPromo = produit.enPromotion && produit.prixPromo;

    const item: CartItem = {
      id: produit.id,
      name: produit.nom,
      price: isPromo ? produit.prixPromo : (produit.prix ?? 0),
      quantity: 1,
      image: produit.image ?? produit.imageUrls?.[0] ?? '',
      category: produit.typeCategorie?.nom ?? 'Bio',
      description: produit.description ?? ''
    };

    this.cartService.addToCart(item);

    // Fermer la modale ouverte avant d'ouvrir le panier
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        if (typeof bootstrap !== 'undefined') {
          // Fermer toutes les modales ouvertes
          const openModals = document.querySelectorAll('.modal.show');
          openModals.forEach(modalEl => {
            const instance = bootstrap.Modal.getInstance(modalEl);
            if (instance) instance.hide();
          });

          // Ouvrir le modal panier après fermeture
          setTimeout(() => {
            const cartModalEl = document.getElementById('cartModal');
            if (cartModalEl) {
              bootstrap.Modal.getOrCreateInstance(cartModalEl).show();
            }
          }, 300);
        }
      }, 100);
    }
  }

  isInCart(id: number): boolean {
    return this.cartService.isInCart(id);
  }

  getItemQuantity(id: number): number {
    return this.cartService.getItemQuantity(id);
  }

  // ══════════════════════════════════════════════════════════
  // Modales produits
  // ══════════════════════════════════════════════════════════

  openGammeModal(gamme: Gamme): void {
    this.selectedGamme = gamme;
    setTimeout(() => {
      if (typeof bootstrap !== 'undefined') {
        const modal = document.getElementById('gammeModal');
        if (modal) bootstrap.Modal.getOrCreateInstance(modal).show();
      }
    }, 100);
  }

  openSportModal(produit: ProduitSport): void {
    this.selectedSport = produit;
    setTimeout(() => {
      if (typeof bootstrap !== 'undefined') {
        const modal = document.getElementById('sportModal');
        if (modal) bootstrap.Modal.getOrCreateInstance(modal).show();
      }
    }, 100);
  }

  // ══════════════════════════════════════════════════════════
  // Témoignages — Vidéo & Lightbox
  // ══════════════════════════════════════════════════════════

  openVideoModal(videoUrl: string): void {
    const embedUrl = this.temoignageService.getYoutubeEmbedUrl(videoUrl);
    this.currentVideoUrl = embedUrl
      ? this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl)
      : null;
    this.currentVideoExternalUrl = videoUrl;
    this.showVideoModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeVideoModal(): void {
    this.showVideoModal = false;
    this.currentVideoUrl = null;
    document.body.style.overflow = '';
  }

  openLightbox(imageUrl: string): void {
    this.currentImageUrl = imageUrl;
    this.showLightbox = true;
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.showLightbox = false;
    document.body.style.overflow = '';
  }

  extractYoutubeId(url: string): string {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/\s]{11})/);
    return match ? match[1] : '';
  }

  getInitials(temoignage: Temoignage): string {
    if (temoignage.nom_complet) {
      return temoignage.nom_complet.substring(0, 2).toUpperCase();
    }
    if (temoignage.user) {
      return `${temoignage.user.prenom?.[0] || ''}${temoignage.user.nom?.[0] || ''}`.toUpperCase();
    }
    return 'CL';
  }

  // ══════════════════════════════════════════════════════════
  // Initialisation des librairies
  // ══════════════════════════════════════════════════════════

  initLibraries(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (typeof AOS !== 'undefined') {
      AOS.init({ duration: 1000, once: true, offset: 100 });
    }
    this.initBootstrapCarousel();
    this.initSwiper();
    this.initCounters();
    this.initModals();
  }

  initBootstrapCarousel(): void {
    const el = document.getElementById('carouselId');
    if (el && typeof bootstrap !== 'undefined' && !this.carouselInitialized) {
      new bootstrap.Carousel(el, { interval: 3000, ride: 'carousel' });
      this.carouselInitialized = true;
    }
  }

  initSwiper(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    import('swiper').then((module) => {
      import('swiper/modules').then(({ Autoplay, Pagination, Navigation }) => {
        setTimeout(() => {
          this.destroySwiper();

          const configCommun = {
            modules: [Autoplay, Pagination, Navigation],
            slidesPerView: 1,
            spaceBetween: 24,
            loop: false,
            speed: 500,
            breakpoints: {
              480: { slidesPerView: 1, spaceBetween: 20 },
              640: { slidesPerView: 2, spaceBetween: 24 },
              992: { slidesPerView: 2, spaceBetween: 24 },
              1200: { slidesPerView: 3, spaceBetween: 28 },
              1400: { slidesPerView: 3, spaceBetween: 30 },
            }
          };

          const gammeEl = document.querySelector('.gammes-swiper');
          if (gammeEl) {
            try {
              this.gammeSwiper = new module.default('.gammes-swiper', {
                ...configCommun,
                autoplay: {
                  delay: 3000,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                },
                pagination: {
                  el: '.gammes-swiper .swiper-pagination',
                  clickable: true,
                  dynamicBullets: true,
                },
                navigation: {
                  nextEl: '.gammes-swiper .swiper-button-next',
                  prevEl: '.gammes-swiper .swiper-button-prev',
                },
              });
            } catch (e) {
              console.error('Erreur Swiper gammes:', e);
            }
          }

          const sportEl = document.querySelector('.sport-swiper');
          if (sportEl) {
            try {
              this.sportSwiper = new module.default('.sport-swiper', {
                ...configCommun,
                pagination: {
                  el: '.sport-swiper .swiper-pagination',
                  clickable: true,
                  dynamicBullets: true,
                },
                navigation: {
                  nextEl: '.sport-swiper .swiper-button-next',
                  prevEl: '.sport-swiper .swiper-button-prev',
                },
              });
            } catch (e) {
              console.error('Erreur Swiper sport:', e);
            }
          }

        }, 300);
      });
    });
  }

  private destroySwiper(): void {
    if (this.gammeSwiper && !this.gammeSwiper.destroyed) {
      this.gammeSwiper.destroy(true, true);
      this.gammeSwiper = null;
    }
    if (this.sportSwiper && !this.sportSwiper.destroyed) {
      this.sportSwiper.destroy(true, true);
      this.sportSwiper = null;
    }
  }

  initCounters(): void {
    const counters = document.querySelectorAll('.counter');
    const speed = 200;
    const animateCounter = (counter: Element) => {
      const target = parseInt(counter.getAttribute('data-target') || '0', 10);
      const count = parseInt(counter.textContent || '0', 10);
      const increment = target / speed;
      if (count < target) {
        counter.textContent = Math.ceil(count + increment).toString();
        setTimeout(() => animateCounter(counter), 10);
      } else {
        counter.textContent = target + (target === 100 ? '' : '+');
      }
    };
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          this.observer?.unobserve(entry.target);
        }
      });
    });
    counters.forEach(counter => this.observer?.observe(counter));
  }

  initModals(): void {
    document.querySelectorAll('[data-bs-toggle="modal"]').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const target = button.getAttribute('data-bs-target');
        if (target && typeof bootstrap !== 'undefined') {
          new bootstrap.Modal(document.querySelector(target)).show();
        }
      });
    });
  }

  // ══════════════════════════════════════════════════════════
  // Filtrage — Section Catalogue
  // ══════════════════════════════════════════════════════════

  setActiveGammeTab(tab: string): void {
    this.activeGammeTab = tab;
    setTimeout(() => this.initSwiper(), 200);
  }

  getFilteredContent(): { type: 'gammes' | 'sport' | 'all'; gammes: Gamme[]; produitsSport: ProduitSport[] } {
    if (this.activeGammeTab === 'all') {
      return { type: 'all', gammes: this.gammes, produitsSport: this.produitsSport };
    }

    const selectedType = this.typeCategories.find(t => t.id.toString() === this.activeGammeTab);
    if (!selectedType) {
      return { type: 'all', gammes: this.gammes, produitsSport: this.produitsSport };
    }

    const gammesFiltrees = this.gammes.filter(g =>
      (g as any).type_categorie_id?.toString() === this.activeGammeTab ||
      (g as any).type_categorie?.id?.toString() === this.activeGammeTab
    );

    const produitsSportFiltres = this.produitsSport.filter(p =>
      p.typeCategorie && p.typeCategorie.id.toString() === this.activeGammeTab
    );

    if (gammesFiltrees.length > 0) {
      return { type: 'gammes', gammes: gammesFiltrees, produitsSport: produitsSportFiltres };
    } else if (produitsSportFiltres.length > 0) {
      return { type: 'sport', gammes: [], produitsSport: produitsSportFiltres };
    } else {
      return { type: 'all', gammes: [], produitsSport: [] };
    }
  }

  // ══════════════════════════════════════════════════════════
  // Filtrage — Section Produits (ancienne, conservée)
  // ══════════════════════════════════════════════════════════

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }

  getProduitsByCategory(categoryId: number): Produit[] {
    return this.produits.filter(p => p.categorie?.id === categoryId);
  }

  // ══════════════════════════════════════════════════════════
  // Actions utilisateur
  // ══════════════════════════════════════════════════════════

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.accueilService.searchProduits(this.searchQuery).subscribe({
        next: (response) => { this.produits = response.data || []; },
        error: (err) => console.error('Erreur recherche:', err)
      });
    }
  }

  onNewsletterSubmit(): void {
    if (this.newsletterEmail) {
      console.log('Inscription newsletter:', this.newsletterEmail);
      this.newsletterEmail = '';
      alert('Merci de votre inscription !');
    }
  }

  // ══════════════════════════════════════════════════════════
  // Utilitaires
  // ══════════════════════════════════════════════════════════

  getWhatsAppLink(vendeur: Vendeur): string {
    const message = encodeURIComponent('Bonjour, je suis intéressé(e) par vos produits BioSen.');
    return `https://wa.me/${vendeur.telephone}?text=${message}`;
  }

  getImageUrl(imagePath?: string): string {
    return this.accueilService.getImageUrl(imagePath);
  }

  getGammeImageUrl(gamme: Gamme | null): string {
    return gamme?.image
      ? this.getImageUrl(gamme.image)
      : 'assets/img/biosen/default-product.png';
  }

  formatPrice(price?: number): string {
    return this.accueilService.formatPrice(price);
  }

  calculateDiscount(original?: number, promo?: number): number {
    return this.accueilService.calculateDiscount(original, promo);
  }

  limitText(text?: string, limit: number = 60): string {
    return this.accueilService.limitText(text, limit);
  }

  getCategoryCount(categoryId: number): number {
    return this.produits.filter(p => p.categorie?.id === categoryId).length;
  }

  produitAppartientAGamme(produit: any, gammeId: number): boolean {
    return produit.gammes?.some((g: any) => g.id === gammeId) || false;
  }

  getProduitsCountByGamme(gammeId: number): number {
    return this.produits.filter(p =>
      p.gammes?.some((g: any) => g.id === gammeId)
    ).length;
  }

  isProduitBio(produit: any): boolean {
    return produit.categorie?.type_categorie_id === 1;
  }
}