import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { ProduitSportService, ProduitSport, MediaItem } from '../../../services/produit-sport/produit-sport.service';

@Component({
  selector: 'app-sport-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sport-detail.component.html',
  styleUrls: ['./sport-detail.component.css']
})
export class SportDetailComponent implements OnInit, OnDestroy {
  produit?: ProduitSport;
  medias: MediaItem[] = [];
  currentIndex = 0;
  loading = true;
  error = '';

  // États pour la modale vidéo
  showVideoModal = false;
  currentVideoUrl: SafeResourceUrl | null = null;
  currentVideoExternalUrl = '';

  // Lightbox pour les images
  showLightbox = false;
  currentImageUrl = '';

  private subscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    public produitService: ProduitSportService, // public pour accès dans le template
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduit(+id);
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    // Restaurer le scroll si nécessaire
    document.body.style.overflow = '';
  }

  loadProduit(id: number): void {
    this.loading = true;
    this.subscription = this.produitService.getProduit(id).subscribe({
      next: (produit) => {
        this.produit = produit;
        this.loadMedias(id);
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement du produit';
        this.loading = false;
        console.error(err);
      }
    });
  }

  loadMedias(id: number): void {
    this.produitService.getMedias(id).subscribe({
      next: (response) => {
        this.medias = response.medias; // déjà au format MediaItem[]
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement médias', err);
        this.loading = false;
      }
    });
  }

  getCurrentMedia(): MediaItem | undefined {
    return this.medias[this.currentIndex];
  }

  isImage(media: MediaItem): boolean {
    return media.type === 'image';
  }

  isVideo(media: MediaItem): boolean {
    return media.type === 'video';
  }

  // Ouvre la modale vidéo
  openVideoModal(media: MediaItem): void {
    if (media.type !== 'video') return;

    const embedUrl = this.produitService.getEmbedUrl(media.url);
    this.currentVideoUrl = embedUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl) : null;
    this.currentVideoExternalUrl = media.url;
    this.showVideoModal = true;
    document.body.style.overflow = 'hidden';
  }

  // Ferme la modale vidéo
  closeVideoModal(): void {
    this.showVideoModal = false;
    this.currentVideoUrl = null;
    document.body.style.overflow = '';
  }

  // Ouvre la lightbox pour les images
  openLightbox(imageUrl: string): void {
    this.currentImageUrl = imageUrl;
    this.showLightbox = true;
    document.body.style.overflow = 'hidden';
  }

  // Ferme la lightbox
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

  getImagesCount(): number {
    return this.medias.filter(m => m.type === 'image').length;
  }

  getVideosCount(): number {
    return this.medias.filter(m => m.type === 'video').length;
  }

  previousMedia(): void {
    if (this.medias.length === 0) return;
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = this.medias.length - 1;
    }
  }

  nextMedia(): void {
    if (this.medias.length === 0) return;
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

  // Image de secours (ancien format ou première image)
  getLegacyImage(): string {
    if (this.produit?.imageUrls && this.produit.imageUrls.length > 0) {
      return this.produit.imageUrls[0];
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

  // Récupère la vignette d'une vidéo (YouTube uniquement)
  getVideoThumbnail(media: MediaItem): string {
    if (media.type !== 'video') return 'assets/img/video-placeholder.jpg';
    return this.produitService.getYouTubeThumbnail(media.url) ?? 'assets/img/video-placeholder.jpg';
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/img/placeholder.jpeg';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price);
  }
}