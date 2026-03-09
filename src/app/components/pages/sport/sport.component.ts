import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProduitSportService } from '../../../services/produit-sport/produit-sport.service';
import { debounceTime, Subject, switchMap } from 'rxjs';
import { TypeCategorieService } from '../../../services/type-categorie/type-categorie.service';
import { TypeCategorie } from '../../../models/type-categorie';

@Component({
  selector: 'app-sport',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './sport.component.html',
  styleUrls: ['./sport.component.css']
})
export class SportComponent implements OnInit {
  produits: any[] = [];
  typeCategories: TypeCategorie[] = [];
  pagination: any = {
    current_page: 1,
    last_page: 1,
    total: 0
  };

  // Statistiques pour la sidebar
  stats: any = {
    total: 0,
    prix_max: 50000,
    categories_count: {}
  };

  // Filtres
  filters = {
    search: '',
    categorie: '',
    prix_max: 50000,
    en_promotion: false,
    sort: 'default',
    page: 1
  };

  // Pour le debounce de la recherche
  private searchSubject = new Subject<string>();
  loading = false;
  error = '';

  constructor(
    private produitService: ProduitSportService,
    private typeCategorieService: TypeCategorieService,
    private router: Router
  ) {
    // Debounce pour la recherche (évite trop de requêtes)
    this.searchSubject.pipe(
      debounceTime(500)
    ).subscribe(() => {
      this.filters.page = 1;
      this.loadProduits();
    });
  }

  ngOnInit(): void {
    this.loadProduits();
    this.loadTypeCategories();
  }

  // Charger les produits avec les filtres
  loadProduits(): void {
    this.loading = true;

    // Construire les paramètres
    const params: any = {
      page: this.filters.page
    };

    if (this.filters.search) params.search = this.filters.search;
    if (this.filters.categorie) params.categorie = this.filters.categorie;
    if (this.filters.prix_max) params.prix_max = this.filters.prix_max;
    if (this.filters.en_promotion) params.en_promotion = 1;
    if (this.filters.sort && this.filters.sort !== 'default') {
      params.sort = this.filters.sort;
    }

    this.produitService.getProduitsWithFilters(params).subscribe({
      next: (response: any) => {
        this.produits = response.produits.data;
        this.pagination = {
          current_page: response.produits.current_page,
          last_page: response.produits.last_page,
          total: response.produits.total,
          per_page: response.produits.per_page
        };

        // Mettre à jour les stats
        if (response.stats) {
          this.stats = response.stats;
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement produits:', err);
        this.error = 'Erreur lors du chargement des produits';
        this.loading = false;
      }
    });
  }

  // Charger les catégories
  loadTypeCategories(): void {
    this.typeCategorieService.getTypeCategories(1).subscribe({
      next: (res) => {
        this.typeCategories = res.data;
      },
      error: (err) => console.error('Erreur chargement types catégories', err)
    });
  }

  // Mise à jour de la recherche
  onSearchChange(search: string): void {
    this.filters.search = search;
    this.searchSubject.next(search);
  }

  // Changer de page
  changePage(page: number): void {
    if (page >= 1 && page <= this.pagination.last_page) {
      this.filters.page = page;
      this.loadProduits();
      // Scroll en haut de la page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Appliquer les filtres
  applyFilters(): void {
    this.filters.page = 1;
    this.loadProduits();
  }

  // Réinitialiser tous les filtres
  resetFilters(): void {
    this.filters = {
      search: '',
      categorie: '',
      prix_max: this.stats.prix_max || 50000,
      en_promotion: false,
      sort: 'default',
      page: 1
    };
    this.loadProduits();
  }

  // Mettre à jour le prix max (pour le slider)
  updatePrixMax(event: any): void {
    this.filters.prix_max = event.target.value;
  }

  // Obtenir l'URL de l'image
  getImageUrl(produit: any): string {
    const images = this.getImages(produit);
    if (images.length > 0) {
      return this.produitService.getImageUrl(images[0].chemin);
    }
    return 'assets/img/placeholder.jpeg';
  }

  // Obtenir toutes les images d'un produit
  getImages(produit: any) {
    return produit.medias?.filter((m: any) => m.type === 'image') || [];
  }

  // Obtenir toutes les vidéos d'un produit
  getVideos(produit: any) {
    return produit.medias?.filter((m: any) => m.type === 'video_url') || [];
  }

  // Vérifier si le produit est nouveau (< 30 jours)
  isNew(produit: any): boolean {
    if (!produit.created_at) return false;
    const created = new Date(produit.created_at);
    const diff = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
    return diff < 30;
  }

  // Gérer l'erreur de chargement d'image
  onImageError(event: any): void {
    event.target.src = 'assets/img/placeholder.jpeg';
  }

  // Naviguer vers le détail du produit
  voirDetail(id: number): void {
    this.router.navigate(['/sport', id]);
  }

  // Obtenir le nombre de produits par catégorie
  getCategoryCount(categoryId: number): number {
    return this.stats.categories_count?.[categoryId] || 0;
  }

  // Vérifier si une catégorie est active
  isCategoryActive(categoryId: number): boolean {
    return this.filters.categorie === categoryId.toString();
  }

  // Obtenir le statut du stock
  getStockStatus(produit: any): { class: string; text: string } {
    if (produit.stock <= 0) {
      return { class: 'text-danger', text: 'Rupture de stock' };
    } else if (produit.stock < 10) {
      return { class: 'text-warning', text: `Plus que ${produit.stock} en stock` };
    }
    return { class: 'text-success', text: '' };
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price);
  }
  getPages(): number[] {
    const pages: number[] = [];
    const total = this.pagination.last_page;
    const current = this.pagination.current_page;

    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push(-1); // Séparateur
        pages.push(total);
      } else if (current >= total - 2) {
        pages.push(1);
        pages.push(-1); // Séparateur
        for (let i = total - 3; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1); // Séparateur
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push(-1); // Séparateur
        pages.push(total);
      }
    }
    return pages;
  }

// Aller à un slide spécifique
  goToSlide(event: any, produitId: number, index: number): void {
    event.preventDefault();
    // Trouver le conteneur du slider
    const sliderWrap = event.target.closest('.sport-card__img-wrap');
    if (sliderWrap) {
      const slides = sliderWrap.querySelectorAll('.sport-slide');
      const dots = sliderWrap.querySelectorAll('.sdot');
      const counter = sliderWrap.querySelector('.slide-count');

      slides.forEach((slide: any, i: number) => {
        slide.classList.toggle('active', i === index);
      });

      dots.forEach((dot: any, i: number) => {
        dot.classList.toggle('sdot-on', i === index);
      });

      if (counter) {
        counter.textContent = `${index + 1} / ${slides.length}`;
      }
    }
  }
}
