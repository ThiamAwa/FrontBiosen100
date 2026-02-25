import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router'; // Ajouter RouterModule
import { ProduitSport, ProduitMedia } from '../../../models/produit-sport.model';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { ProduitSportService } from '../../../services/produit-sport/produit-sport.service';
import { environment } from '../../../../environments/environment'; // 👈 IMPORTER ENVIRONMENT

@Component({
  selector: 'app-sport-detail',
  standalone: true,
  imports: [CommonModule, RouterModule], // Ajouter RouterModule pour le lien retour
  templateUrl: './sport-detail.component.html',
  styleUrls: ['./sport-detail.component.css']
})
export class SportDetailComponent implements OnInit, OnDestroy {
  produit?: ProduitSport;
  medias: ProduitMedia[] = [];
  currentIndex = 0;
  loading = true;
  error = '';

  private subscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private produitService: ProduitSportService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduit(+id);
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  loadProduit(id: number): void {
    this.loading = true;
    this.subscription = this.produitService.getProduit(id).subscribe({
      next: (produit) => {
        this.produit = produit;
        this.medias = produit.medias?.sort((a, b) => a.ordre - b.ordre) || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement du produit';
        this.loading = false;
        console.error(err);
      }
    });
  }

  getCurrentMedia(): ProduitMedia | undefined {
    return this.medias[this.currentIndex];
  }

  isImage(media: ProduitMedia): boolean {
    return media.type === 'image';
  }

  isVideo(media: ProduitMedia): boolean {
    return media.type === 'video_url';
  }

  getVideoEmbedUrl(media: ProduitMedia): SafeResourceUrl | null {
    const url = media.embed_url || media.url_externe;
    if (!url) return null;

    const embedUrl = this.produitService.getEmbedUrl(url);
    return embedUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl) : null;
  }

  getImagesCount(): number {
    return this.medias.filter(m => m.type === 'image').length;
  }

  getVideosCount(): number {
    return this.medias.filter(m => m.type === 'video_url').length;
  }

  previousMedia(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = this.medias.length - 1;
    }
  }

  nextMedia(): void {
    if (this.currentIndex < this.medias.length - 1) {
      this.currentIndex++;
    } else {
      this.currentIndex = 0;
    }
  }

  goToMedia(index: number): void {
    if (index >= 0 && index < this.medias.length) {
      this.currentIndex = index;
    }
  }

  // Pour l'image principale legacy
  getLegacyImage(): string {
    if (this.produit?.image) {
      return this.produit.image.startsWith('http')
        ? this.produit.image
        : `${environment.storageUrl}/${this.produit.image.replace('storage/', '')}`;
    }
    return 'assets/img/placeholder.jpeg';
  }

  getStockStatus(): { class: string; text: string } {
    if (!this.produit) return { class: '', text: '' };

    if (this.produit.stock > 10) {
      return { class: 'bg-success', text: `En stock (${this.produit.stock} disponibles)` };
    } else if (this.produit.stock > 0) {
      return { class: 'bg-warning text-dark', text: `Presque épuisé (${this.produit.stock} restants)` };
    } else {
      return { class: 'bg-danger', text: 'Rupture de stock' };
    }
  }

  addToCart(): void {
    if (!this.produit || this.produit.stock <= 0) return;

    // Logique d'ajout au panier
    console.log('Ajout au panier:', this.produit);
  }
}
