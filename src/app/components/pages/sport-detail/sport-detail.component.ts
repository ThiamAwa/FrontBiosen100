import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProduitSport, ProduitMedia } from '../../../models/produit-sport.model';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { ProduitSportService } from '../../../services/produit-sport/produit-sport.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-sport-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sport-detail.component.html',
  styleUrls: ['./sport-detail.component.css']
})
export class SportDetailComponent implements OnInit, OnDestroy {
  produit?: ProduitSport;
  medias: ProduitMedia[] = [];
  currentIndex = 0;
  loading = true;
  error = '';

  // États pour la modale vidéo (comme dans témoignages)
  showVideoModal = false;
  currentVideoUrl: SafeResourceUrl | null = null;
  currentVideoExternalUrl = '';

  // Lightbox pour les images
  showLightbox = false;
  currentImageUrl = '';

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

  // Méthode pour ouvrir la modale vidéo (comme dans témoignages)
  openVideoModal(media: ProduitMedia): void {
    const url = media.embed_url || media.url_externe;
    if (!url) return;

    const embedUrl = this.produitService.getEmbedUrl(url);
    this.currentVideoUrl = embedUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl) : null;
    this.currentVideoExternalUrl = url;
    this.showVideoModal = true;
    document.body.style.overflow = 'hidden';
  }

  // Fermer la modale vidéo
  closeVideoModal(): void {
    this.showVideoModal = false;
    this.currentVideoUrl = null;
    document.body.style.overflow = '';
  }

  // Ouvrir la lightbox pour les images
  openLightbox(imageUrl: string): void {
    this.currentImageUrl = imageUrl;
    this.showLightbox = true;
    document.body.style.overflow = 'hidden';
  }

  // Fermer la lightbox
  closeLightbox(): void {
    this.showLightbox = false;
    document.body.style.overflow = '';
  }

  // Fermer avec la touche Echap
  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.showVideoModal) this.closeVideoModal();
    if (this.showLightbox) this.closeLightbox();
  }

  // Fermer en cliquant à l'extérieur
  closeOnOutsideClick(event: MouseEvent): void {
    if (this.showVideoModal) this.closeVideoModal();
    if (this.showLightbox) this.closeLightbox();
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

  // Récupérer la vignette de la vidéo
  getVideoThumbnail(media: ProduitMedia): string {
    if (media.youtube_thumbnail) {
      return media.youtube_thumbnail;
    }
    // Fallback si pas de vignette
    return 'assets/img/video-placeholder.jpg';
  }

  onImageError(event: any): void {
    event.target.src = 'assets/img/placeholder.jpeg';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price);
  }
}
