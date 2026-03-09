import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProduitSport, ProduitMedia } from '../../../models/produit-sport';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { ProduitSportService } from '../../../services/produit-sport/produit-sport.service';
import { environment } from '../../../../environments/environment';
import {CartService} from '../../../services/cart/cart.service';

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

  // Filtres
  filters = {
    search: '',
    categorie: '',
    type_categorie: '1',
    prix_max: 50000,
    promo: false,
    tri: 'default',
    page: 1
  };
  private subscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private produitService: ProduitSportService,
    private sanitizer: DomSanitizer,
    public cartService: CartService
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

  // ========== PANIER ==========

  addToCart(item: any): void {
    if (!item || item.stock <= 0) return;

    const prix = item.enPromotion && item.prixPromo ? item.prixPromo : item.prix;

    // 1. Ajouter au panier
    this.cartService.addToCart({
      id: item.id,
      name: item.nom,
      price: prix,
      quantity: 1,
      image: item.image,
      category: this.filters.type_categorie === '2' ? 'Sport' : (item.type_categorie?.nom ?? 'Bio')
    });

    // 2. Animation du bouton
    const button = event?.target as HTMLElement;
    if (button) {
      const originalText = button.innerHTML;
      button.innerHTML = '<i class="fa fa-check me-2"></i>Ajouté !';
      button.style.backgroundColor = '#1e5a38';

      setTimeout(() => {
        button.innerHTML = originalText;
        button.style.backgroundColor = '#287747';
      }, 1500);
    }

    // 3.OUVRIR LE MODAL AUTOMATIQUEMENT
    this.openCartModal();

    // 4. Notification (optionnel)
    this.showNotification('✓ Produit ajouté au panier');
  }
  showNotification(message: string): void {
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

  openCartModal(): void {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
      // @ts-ignore
      const modal = new bootstrap.Modal(cartModal);
      modal.show();
    }
  }
}
