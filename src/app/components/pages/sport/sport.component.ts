import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ProduitSportService, ProduitSport, ProduitSportResponse } from '../../../services/produit-sport/produit-sport.service';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-sport',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './sport.component.html',
  styleUrls: ['./sport.component.css']
})
export class SportComponent implements OnInit {
  produits: ProduitSport[] = [];
  pagination = {
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10
  };

  stats = {
    total: 0,
    prix_max: 50000
  };

  filters = {
    search: '',
    categorie: '',
    prix_max: 50000,
    en_promotion: false,
    sort: 'default',
    page: 1
  };

  private searchSubject = new Subject<string>();
  loading = false;
  error = '';

  constructor(
    private produitService: ProduitSportService,
    private router: Router
  ) {
    this.searchSubject.pipe(debounceTime(500)).subscribe(() => {
      this.filters.page = 1;
      this.loadProduits();
    });
  }

  ngOnInit(): void {
    this.loadProduits();
  }

  loadProduits(): void {
    this.loading = true;
    const params: any = { page: this.filters.page };
    if (this.filters.search) params.search = this.filters.search;
    if (this.filters.categorie) params.categorie = this.filters.categorie;
    if (this.filters.prix_max) params.prix_max = this.filters.prix_max;
    if (this.filters.en_promotion) params.en_promotion = 1;
    if (this.filters.sort && this.filters.sort !== 'default') {
      params.sort = this.filters.sort;
    }

    this.produitService.getProduitsWithFilters(params).subscribe({
      next: (response: ProduitSportResponse) => {
        this.produits = response.produits.data;
        this.pagination = {
          current_page: response.produits.current_page,
          last_page: response.produits.last_page,
          total: response.produits.total,
          per_page: response.produits.per_page
        };
        const maxPrix = Math.max(...this.produits.map(p => p.prix), 0);
        this.stats.prix_max = maxPrix || 50000;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement produits:', err);
        this.error = 'Erreur lors du chargement des produits';
        this.loading = false;
      }
    });
  }

  onSearchChange(search: string): void {
    this.filters.search = search;
    this.searchSubject.next(search);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.pagination.last_page) {
      this.filters.page = page;
      this.loadProduits();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  applyFilters(): void {
    this.filters.page = 1;
    this.loadProduits();
  }

  resetFilters(): void {
    this.filters = {
      search: '',
      categorie: '',
      prix_max: this.stats.prix_max,
      en_promotion: false,
      sort: 'default',
      page: 1
    };
    this.loadProduits();
  }

  updatePrixMax(event: any): void {
    this.filters.prix_max = event.target.value;
  }

  getImages(produit: ProduitSport): { id: number; url: string }[] {
    return (produit.imageUrls || []).map((url, index) => ({ id: index, url }));
  }

  getVideos(produit: ProduitSport): { url: string }[] {
    return produit.video ? [{ url: produit.video }] : [];
  }

  // ✅ Vérifie si le produit est nouveau (moins de 30 jours)
  isNew(produit: ProduitSport): boolean {
    if (!produit.created_at) return false;
    const created = new Date(produit.created_at);
    const diff = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
    return diff < 30;
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/img/placeholder.jpeg';
  }

  voirDetail(id: number): void {
    this.router.navigate(['/sport', id]);
  }

  getStockStatus(produit: ProduitSport): { class: string; text: string } {
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
        pages.push(-1);
        pages.push(total);
      } else if (current >= total - 2) {
        pages.push(1);
        pages.push(-1);
        for (let i = total - 3; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push(-1);
        pages.push(total);
      }
    }
    return pages;
  }

  goToSlide(event: Event, produitId: number, index: number): void {
    event.preventDefault();
    const sliderWrap = (event.target as HTMLElement).closest('.sport-card__img-wrap');
    if (sliderWrap) {
      const slides = sliderWrap.querySelectorAll('.sport-slide');
      const dots = sliderWrap.querySelectorAll('.sdot');
      const counter = sliderWrap.querySelector('.slide-count');

      slides.forEach((slide: Element, i: number) => {
        slide.classList.toggle('active', i === index);
      });

      dots.forEach((dot: Element, i: number) => {
        dot.classList.toggle('sdot-on', i === index);
      });

      if (counter) {
        counter.textContent = `${index + 1} / ${slides.length}`;
      }
    }
  }
}