import { Component, OnInit, OnDestroy, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProduitSportService, ProduitSport, MediaItem } from '../../../services/produit-sport/produit-sport.service';
import { CartService, CartItem } from '../../../services/cart/cart.service';

declare var bootstrap: any;

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

  showVideoModal = false;
  currentVideoUrl: SafeResourceUrl | null = null;
  currentVideoExternalUrl = '';

  showLightbox = false;
  currentImageUrl = '';

  private subscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    public produitService: ProduitSportService,
    private sanitizer: DomSanitizer,
    private cartService: CartService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadProduit(+id);
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
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
        // ✅ Normaliser les URLs via getImageUrl()
        this.medias = response.medias.map(media => ({
          ...media,
          url: media.type === 'image'
            ? this.produitService.getImageUrl(media.url)
            : media.url
        }));
        console.log('Médias normalisés:', this.medias);
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement médias', err);
        this.loading = false;
      }
    });
  }

  // ══════════════════════════════════════════════════════════
  // Panier — Getters réactifs
  // ══════════════════════════════════════════════════════════

  get cartItems(): CartItem[] {
    return this.cartService.getCart();
  }

  get cartSubtotal(): number {
    return this.cartService.getCartTotal();
  }

  get cartCount(): number {
    return this.cartService.getCartCount();
  }

  // ══════════════════════════════════════════════════════════
  // Panier — Actions
  // ══════════════════════════════════════════════════════════

  addToCart(): void {
    if (!this.produit || this.produit.stock <= 0) return;

    const isPromo = this.produit.enPromotion && this.produit.prixPromo;

    // ✅ URL déjà normalisée dans loadMedias()
    let image = '';
    const firstImageMedia = this.medias.find(m => m.type === 'image');
    if (firstImageMedia?.url) {
      image = firstImageMedia.url;
    } else if (this.produit.imageUrls && this.produit.imageUrls.length > 0) {
      image = this.produit.imageUrls[0]; // déjà normalisé via normalizeProduit()
    }

    console.log('Image panier:', image);

    const item: CartItem = {
      id: this.produit.id,
      name: this.produit.nom,
      price: isPromo ? this.produit.prixPromo! : this.produit.prix,
      quantity: 1,
      image: image,
      category: this.produit.typeCategorie?.nom ?? 'Sport',
      description: this.produit.description ?? ''
    };

    this.cartService.addToCart(item);

    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        if (typeof bootstrap !== 'undefined') {
          const cartModalEl = document.getElementById('cartModal');
          if (cartModalEl) {
            bootstrap.Modal.getOrCreateInstance(cartModalEl).show();
          }
        }
      }, 100);
    }
  }

  increaseQuantity(item: CartItem): void {
    this.cartService.incrementQuantity(item.id);
  }

  decreaseQuantity(item: CartItem): void {
    this.cartService.decrementQuantity(item.id);
  }

  removeFromCart(id: number): void {
    this.cartService.removeFromCart(id);
  }

  clearCart(): void {
    this.cartService.clearCart();
  }

  isInCart(): boolean {
    return this.produit ? this.cartService.isInCart(this.produit.id) : false;
  }

  goToCheckout(): void {
    if (isPlatformBrowser(this.platformId) && typeof bootstrap !== 'undefined') {
      const cartModalEl = document.getElementById('cartModal');
      if (cartModalEl) {
        const instance = bootstrap.Modal.getInstance(cartModalEl);
        if (instance) instance.hide();
      }
    }
    this.router.navigate(['/checkout']);
  }

  getCartItemImage(item: CartItem): string {
    return item.image?.trim() ? item.image : '';
  }

  // ══════════════════════════════════════════════════════════
  // Médias
  // ══════════════════════════════════════════════════════════

  getCurrentMedia(): MediaItem | undefined {
    return this.medias[this.currentIndex];
  }

  isImage(media: MediaItem): boolean {
    return media.type === 'image';
  }

  isVideo(media: MediaItem): boolean {
    return media.type === 'video';
  }

  openVideoModal(media: MediaItem): void {
    if (media.type !== 'video') return;
    const embedUrl = this.produitService.getEmbedUrl(media.url);
    this.currentVideoUrl = embedUrl
      ? this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl)
      : null;
    this.currentVideoExternalUrl = media.url;
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
    if (!this.medias.length) return;
    this.currentIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.medias.length - 1;
  }

  nextMedia(): void {
    if (!this.medias.length) return;
    this.currentIndex = this.currentIndex < this.medias.length - 1 ? this.currentIndex + 1 : 0;
  }

  goToMedia(index: number): void {
    if (index >= 0 && index < this.medias.length) this.currentIndex = index;
  }

  getLegacyImage(): string {
    return this.produit?.imageUrls?.[0] ?? 'assets/img/placeholder.jpeg';
  }

  getStockStatus(): { class: string; text: string } {
    if (!this.produit) return { class: '', text: '' };
    if (this.produit.stock > 10) return { class: 'bg-success', text: `En stock (${this.produit.stock} disponibles)` };
    if (this.produit.stock > 0) return { class: 'bg-warning text-dark', text: `Presque épuisé (${this.produit.stock} restants)` };
    return { class: 'bg-danger', text: 'Rupture de stock' };
  }

  getVideoThumbnail(media: MediaItem): string {
    if (media.type !== 'video') return 'assets/img/placeholder.jpeg';
    return this.produitService.getYouTubeThumbnail(media.url) ?? 'assets/img/placeholder.jpeg';
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.onerror = null; // ✅ Stop boucle infinie
    img.src = 'assets/img/placeholder.jpeg';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price);
  }
}