import { Component, OnInit, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

import { Observable } from 'rxjs';

// Services

// import { GammeService, Gamme } from '../../../services/gamme/gamme.service';
// import { ProduitService, Produit } from '../../../services/produit/produit.service';
// import { CategorieService, Categorie } from '../../../services/categorie/categorie.service';
import { VendeurService, Vendeur } from '../../../services/vendeur/vendeur.service';

// Composant WhatsApp (à créer)

import { WhatsappComponent } from '../../whatsapp/whatsapp.component';

declare var $: any; // Pour jQuery (Owl Carousel)
declare var AOS: any; // Pour AOS

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,

    WhatsappComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {
  // Observables exposés au template avec le pipe async
  // gammes$: Observable<Gamme[]>;
  // produits$: Observable<Produit[]>;
  // categories$: Observable<Categorie[]>;
  vendeurs$: Observable<Vendeur[]>;

  // Pour le compteur de produits (statistiques)
  produitsCount: number = 0;

  constructor(
    // private gammeService: GammeService,
    // private produitService: ProduitService,
    // private categorieService: CategorieService,
    private vendeurService: VendeurService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Initialisation des observables
    // this.gammes$ = this.gammeService.getGammes();
    // this.produits$ = this.produitService.getProduits();
    // this.categories$ = this.categorieService.getCategories();
    this.vendeurs$ = this.vendeurService.getVendeurs();

    // Souscription pour obtenir le nombre total de produits (compteur)
    // this.produits$.subscribe(produits => {
    //   this.produitsCount = produits.length;
    // });
  }

  ngOnInit(): void {
    // AOS sera initialisé dans ngAfterViewInit pour garantir que le DOM est prêt
  }

  ngAfterViewInit(): void {
    // Vérifier qu'on est dans le navigateur (évite les erreurs lors du rendu côté serveur)
    if (isPlatformBrowser(this.platformId)) {
      // Initialisation d'AOS (Animate On Scroll)
      AOS.init({
        duration: 1000,
        once: true,
        offset: 100
      });

      // Initialisation du carrousel Owl pour les gammes
      this.initOwlCarousel();

      // Animation des compteurs (statistiques)
      this.initCounters();

      // Activation manuelle des tooltips Bootstrap si nécessaire
      // (optionnel, car Bootstrap les gère via data-bs-toggle)
    }
  }

  /**
   * Initialise le carrousel Owl pour les gammes (Catégories Phares)
   */
  private initOwlCarousel(): void {
    $('.gammes-carousel').owlCarousel({
      autoplay: true,
      autoplayTimeout: 3000,
      autoplayHoverPause: true,
      smartSpeed: 1000,
      margin: 24,
      dots: false,
      loop: true,
      nav: false,
      responsive: {
        0: { items: 1 },
        576: { items: 2 },
        992: { items: 3 },
        1200: { items: 4 }
      }
    });
  }

  /**
   * Animation des compteurs (statistiques) quand ils deviennent visibles
   */
  private initCounters(): void {
    const counters = document.querySelectorAll('.counter');
    const speed = 200;

    const animateCounters = () => {
      counters.forEach(counter => {
        const target = +(counter.getAttribute('data-target') || '0');
        const count = +(counter.textContent || '0');
        const increment = target / speed;

        if (count < target) {
          counter.textContent = Math.ceil(count + increment).toString();
          setTimeout(() => animateCounters(), 1);
        } else {
          counter.textContent = target + (target === 100 ? '' : '+');
        }
      });
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounters();
          observer.unobserve(entry.target);
        }
      });
    });

    counters.forEach(counter => observer.observe(counter));
  }

  /**
   * Défilement fluide vers un élément (pour les ancres)
   */
  scrollToElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Formate un prix en FCFA (ex: 1500 -> 1 500 FCFA)
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  }

  /**
   * Tronque un texte à une certaine longueur
   */
  truncate(text: string, limit: number): string {
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  }

  /**
   * Retourne un observable des produits filtrés par catégorie.
   * Utilisé dans les onglets par catégorie.
   */
  // produitsByCategorie(categorieId: number): Observable<Produit[]> {
  //   return this.produitService.getProduitsByCategorie(categorieId);
  // }
}
