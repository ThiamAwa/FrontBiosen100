// src/app/components/pages/home/home.component.ts
import { Component, OnInit, AfterViewInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { HomeService } from '../../../services/home/home.service';
import { Produit } from '../../../models/produit';
import {AccueilData} from '../../../models/accueilData';
import {Gamme} from '../../../models/gamme';
import {Vendeur} from '../../../models/vendeur';
import Swiper from 'swiper';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';

// Déclaration pour les librairies externes
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
  data: AccueilData | null = null;
  produits: Produit[] = [];
  produitsPromo: Produit[] = [];
  gammes: Gamme[] = [];
  categories: any[] = [];
  vendeurs: Vendeur[] = [];
  stats: any = {
    total_produits: 0,
    total_gammes: 0,
    total_categories: 0,
    produits_promo: 0
  };

  loading = true;
  error = '';
  searchQuery = '';
  newsletterEmail = '';
  currentYear = new Date().getFullYear();

  selectedGamme: Gamme | null = null;
  activeTab = 'all';
  private carouselInitialized = false;
  private owlInitialized = false;
  private observer: IntersectionObserver | null = null;

  constructor(
    private accueilService: HomeService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loadData();

    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        console.log('jQuery chargé:', typeof $ !== 'undefined');
        console.log('Owl Carousel chargé:', typeof $ !== 'undefined' && $.fn.owlCarousel ? 'oui' : 'non');
      }, 2000);
    }
  }
  ngAfterViewInit(): void {
    setTimeout(() => {
      if (typeof bootstrap !== 'undefined') {
        const carouselElement = document.getElementById('carouselId');
        if (carouselElement) {
          new bootstrap.Carousel(carouselElement, {
            interval: 3000,
            ride: 'carousel'
          });
        }
      }
    }, 500);
  }
  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  loadData(): void {
    this.loading = true;
    this.accueilService.getAccueilData().subscribe({
      next: (response) => {
        this.data = response;
        this.produits = response.produits || [];
        this.produitsPromo = response.produitsPromo || [];
        this.gammes = response.gammes || [];
        this.categories = response.categories || [];
        this.vendeurs = response.vendeurs || [];
        this.stats = response.stats || this.stats;
        this.loading = false;

        setTimeout(() => {
          this.initLibraries();
        }, 1000);
      },
      error: (err) => {
        console.error('Erreur chargement accueil:', err);
        this.error = 'Erreur lors du chargement de la page';
        this.loading = false;
      }
    });
  }

  initLibraries(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Initialiser AOS
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 1000,
        once: true,
        offset: 100
      });
    }

    // Initialiser le carousel Bootstrap
    this.initBootstrapCarousel();

    // Initialiser Swiper au lieu d'Owl Carousel
    this.initSwiper();

    // Initialiser les compteurs
    this.initCounters();

    // Initialiser les modals
    this.initModals();
  }

  initBootstrapCarousel(): void {
    const carouselElement = document.getElementById('carouselId');
    if (carouselElement && typeof bootstrap !== 'undefined' && !this.carouselInitialized) {
      new bootstrap.Carousel(carouselElement, {
        interval: 3000,
        ride: 'carousel'
      });
      this.carouselInitialized = true;
    }
  }

  initSwiper(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    import('swiper').then((module) => {
      import('swiper/modules').then(({ Autoplay, Pagination, Navigation }) => {
        setTimeout(() => {
          try {
            const swiperEl = document.querySelector('.gammes-swiper');
            if (!swiperEl) {
              console.warn('Swiper element not found');
              return;
            }

            new module.default('.gammes-swiper', {
              modules: [Autoplay, Pagination, Navigation],
              slidesPerView: 1,
              spaceBetween: 20,
              loop: true,
              speed: 600,              // ✅ Transition plus rapide (600ms au lieu de 800ms)

              autoplay: {
                delay: 1800,           // ✅ Défilement toutes les 1.8s (au lieu de 3s)
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

              breakpoints: {
                576: { slidesPerView: 2, spaceBetween: 16 },
                992: { slidesPerView: 3, spaceBetween: 20 },
                1200: { slidesPerView: 4, spaceBetween: 20 },
              },

              on: {
                init: function () {
                  console.log('✅ Swiper initialisé');
                }
              }
            });

          } catch (error) {
            console.error('❌ Erreur Swiper:', error);
          }
        }, 800);
      });
    });
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
          const modal = new bootstrap.Modal(document.querySelector(target));
          modal.show();
        }
      });
    });
  }

  openGammeModal(gamme: Gamme): void {
    this.selectedGamme = gamme;
    setTimeout(() => {
      if (typeof bootstrap !== 'undefined') {
        const modal = document.getElementById('gammeModal');
        if (modal) {
          new bootstrap.Modal(modal).show();
        }
      }
    }, 100);
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.accueilService.searchProduits(this.searchQuery).subscribe({
        next: (response) => {
          this.produits = response.data || [];
        },
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

  getWhatsAppLink(vendeur: Vendeur): string {
    const message = encodeURIComponent('Bonjour, je suis intéressé(e) par vos produits BioSen.');
    return `https://wa.me/${vendeur.telephone}?text=${message}`;
  }

  getImageUrl(imagePath?: string): string {
    return this.accueilService.getImageUrl(imagePath);
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

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }

  getProduitsByCategory(categoryId: number): Produit[] {
    return this.produits.filter(p => p.categorie?.id === categoryId);
  }
// Méthode pour vérifier si un produit appartient à une gamme
  produitAppartientAGamme(produit: any, gammeId: number): boolean {
    return produit.gammes?.some((g: any) => g.id === gammeId) || false;
  }

// Méthode pour obtenir le nombre de produits par gamme
  getProduitsCountByGamme(gammeId: number): number {
    return this.produits.filter(p =>
      p.gammes?.some((g: any) => g.id === gammeId)
    ).length;
  }

  isProduitBio(produit: any): boolean {
    console.log('Produit:', produit.nom, 'Catégorie:', produit.categorie);
    return produit.categorie?.type_categorie_id === 1;
  }
  getGammeImageUrl(gamme: Gamme | null): string {
    return gamme?.image ? this.getImageUrl(gamme.image) : 'assets/img/biosen/default-product.png';
  }
}
