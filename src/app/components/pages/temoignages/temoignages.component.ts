import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TemoignageService } from '../../../services/temoignage/temoignage.service';
import { Temoignage } from '../../../models/temoignage';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-temoignages',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './temoignages.component.html',
  styleUrls: ['./temoignages.component.css']
})
export class TemoignagesComponent implements OnInit, OnDestroy {
  temoignages: Temoignage[] = [];
  loading = true;
  error = '';

  // État des carrousels
  carouselStates: Map<number, { currentIndex: number; timer: any }> = new Map();

  // Lightbox
  showLightbox = false;
  currentImageUrl = '';

  // Cache des URLs embed sécurisées
  private safeUrlCache: Map<string, SafeResourceUrl> = new Map();

  private subscriptions: Subscription[] = [];
  private autoDelay = 4000; // 4 secondes (plus long car vidéo en premier)

  constructor(
    private temoignageService: TemoignageService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadTemoignages();
  }

  ngOnDestroy(): void {
    this.carouselStates.forEach(state => {
      if (state.timer) clearInterval(state.timer);
    });
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadTemoignages(): void {
    this.loading = true;
    this.subscriptions.push(
      this.temoignageService.getTemoignagesPublics().subscribe({
        next: (data) => {
          this.temoignages = Array.isArray(data) ? data : [];
          this.loading = false;
          // Pré-cacher les URL embed sécurisées
          this.temoignages.forEach(t => {
            if (t.video_url) this.getSafeEmbedUrl(t.video_url);
          });
          setTimeout(() => this.initCarousels(), 100);
        },
        error: (err) => {
          console.error('Erreur chargement témoignages:', err);
          this.error = 'Erreur lors du chargement des témoignages';
          this.loading = false;
        }
      })
    );
  }

  // ─── Embed URL sécurisée (avec cache) ───────────────────────────────────────
  getSafeEmbedUrl(videoUrl: string): SafeResourceUrl {
    if (this.safeUrlCache.has(videoUrl)) {
      return this.safeUrlCache.get(videoUrl)!;
    }
    const embedUrl = this.temoignageService.getYoutubeEmbedUrl(videoUrl) || videoUrl;
    // Ajouter autoplay=0 pour ne pas lancer automatiquement
    const finalUrl = embedUrl.includes('?')
      ? `${embedUrl}&rel=0&modestbranding=1`
      : `${embedUrl}?rel=0&modestbranding=1`;
    const safe = this.sanitizer.bypassSecurityTrustResourceUrl(finalUrl);
    this.safeUrlCache.set(videoUrl, safe);
    return safe;
  }

  // ─── Nombre total de slides (vidéo + photos) ────────────────────────────────
  getTotalSlides(t: Temoignage): number {
    let count = 0;
    if (t.video_url) count += 1;
    if (t.images) count += t.images.length;
    return count;
  }

  // ─── Vérifier si un slide est actif ─────────────────────────────────────────
  isSlideActive(id: number, index: number): boolean {
    return this.getCurrentIndex(id) === index;
  }

  // ─── Initialiser les carrousels ──────────────────────────────────────────────
  initCarousels(): void {
    this.temoignages.forEach(t => {
      if (t.id && this.getTotalSlides(t) > 1) {
        // Démarrer à l'index 0 (la vidéo si elle existe)
        this.carouselStates.set(t.id, { currentIndex: 0, timer: null });
        this.startCarousel(t.id);
      } else if (t.id) {
        this.carouselStates.set(t.id, { currentIndex: 0, timer: null });
      }
    });
  }

  // ─── Auto-défilement ─────────────────────────────────────────────────────────
  startCarousel(id: number): void {
    const temoignage = this.temoignages.find(t => t.id === id);
    if (!temoignage) return;
    const total = this.getTotalSlides(temoignage);
    if (total <= 1) return;

    const state = this.carouselStates.get(id) || { currentIndex: 0, timer: null };
    if (state.timer) clearInterval(state.timer);

    // Délai plus long pour le slide vidéo (index 0)
    const delay = state.currentIndex === 0 && temoignage.video_url
      ? this.autoDelay * 2  // 8s pour la vidéo
      : this.autoDelay;     // 4s pour les photos

    state.timer = setTimeout(() => {
      const next = (state.currentIndex + 1) % total;
      this.goToSlide(id, next);
      this.startCarousel(id); // relancer pour adapter le délai
    }, delay);

    this.carouselStates.set(id, state);
  }

  stopCarousel(id: number): void {
    const state = this.carouselStates.get(id);
    if (state?.timer) {
      clearTimeout(state.timer);
      state.timer = null;
    }
  }

  goToSlide(id: number, index: number): void {
    const state = this.carouselStates.get(id);
    if (state) {
      state.currentIndex = index;
      this.carouselStates.set(id, state);
    }
  }

  nextSlide(id: number, event?: Event): void {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const temoignage = this.temoignages.find(t => t.id === id);
    if (!temoignage) return;
    const total = this.getTotalSlides(temoignage);
    const state = this.carouselStates.get(id) || { currentIndex: 0, timer: null };
    const next = Math.min(state.currentIndex + 1, total - 1);
    this.goToSlide(id, next);
    this.pauseAndResume(id);
  }

  prevSlide(id: number, event?: Event): void {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const state = this.carouselStates.get(id) || { currentIndex: 0, timer: null };
    const prev = Math.max(state.currentIndex - 1, 0);
    this.goToSlide(id, prev);
    this.pauseAndResume(id);
  }

  pauseAndResume(id: number): void {
    this.stopCarousel(id);
    setTimeout(() => this.startCarousel(id), this.autoDelay);
  }

  getCurrentIndex(id: number): number {
    return this.carouselStates.get(id)?.currentIndex || 0;
  }

  // ─── Helpers images (gardés pour compatibilité) ──────────────────────────────
  getTemoignageImages(id: number): string[] | undefined {
    return this.temoignages.find(t => t.id === id)?.images;
  }

  isImageActive(id: number, index: number): boolean {
    return this.getCurrentIndex(id) === index;
  }

  getImageCount(id: number): number {
    return this.getTemoignageImages(id)?.length || 0;
  }

  hasMultipleImages(id: number): boolean {
    return (this.getTemoignageImages(id)?.length || 0) > 1;
  }

  // ─── Avatar ──────────────────────────────────────────────────────────────────
  getInitials(temoignage: Temoignage): string {
    if (temoignage.nom_complet) {
      return temoignage.nom_complet.substring(0, 2).toUpperCase();
    }
    if (temoignage.user) {
      return `${(temoignage.user.prenom?.[0] || '')}${(temoignage.user.nom?.[0] || '')}`.toUpperCase();
    }
    return 'CL';
  }

  // ─── Lightbox ────────────────────────────────────────────────────────────────
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
    if (this.showLightbox) this.closeLightbox();
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }
}