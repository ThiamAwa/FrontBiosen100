import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ProduitSportService } from '../../../services/produit-sport/produit-sport.service';

@Component({
  selector: 'app-sport',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './sport.component.html',
  styleUrl: './sport.component.css'
})
export class SportComponent implements OnInit {
  produits: any[] = [];
  categories: any[] = [];
  pagination: any;

  constructor(
    private produitService: ProduitSportService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProduits();
  }

  loadProduits(page: number = 1) {
    this.produitService.getProduits(page).subscribe({
      next: (res) => {
        this.produits = res.produits.data;
        this.categories = res.categories;
        this.pagination = res.produits;
        console.log('Produits chargés:', this.produits);
      },
      error: (err) => {
        console.error('Erreur chargement produits:', err);
      }
    });
  }

  getImageUrl(produit: any): string {
    const images = this.getImages(produit);
    if (images.length > 0) {
      return this.produitService.getImageUrl(images[0].chemin);
    }
    return 'assets/img/placeholder.jpeg';
  }

  getImages(produit: any) {
    return produit.medias?.filter((m: any) => m.type === 'image') || [];
  }

  isNew(produit: any): boolean {
    if (!produit.created_at) return false;
    const created = new Date(produit.created_at);
    const diff = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
    return diff < 30;
  }

  onImageError(event: any) {
    console.log('Erreur de chargement d\'image, utilisation du placeholder');
    event.target.src = 'assets/img/placeholder.jpeg';
  }

  voirDetail(id: number) {
    this.router.navigate(['/sport', id]);
  }
}
