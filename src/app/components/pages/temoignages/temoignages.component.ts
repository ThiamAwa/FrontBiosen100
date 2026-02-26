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

  // Modal vidéo
  showVideoModal = false;
  currentVideoUrl: SafeResourceUrl | null = null;
  currentVideoExternalUrl = '';

  // Lightbox
  showLightbox = false;
  currentImageUrl = '';

  private subscriptions: Subscription[] = [];
  private autoDelay = 3000; // 3 secondes

  constructor(
    private temoignageService: TemoignageService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadTemoignages();
  }

  ngOnDestroy(): void {
    // Nettoyer tous les timers
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
          this.temoignages = data;
          this.loading = false;
          // Initialiser les carrousels après le chargement
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

  // Initialiser les carrousels
  initCarousels(): void {
    this.temoignages.forEach(temoignage => {
      if (temoignage.id && temoignage.images && temoignage.images.length > 1) {
        this.startCarousel(temoignage.id);
      }
    });
  }

  // Démarrer l'auto-défilement
  startCarousel(id: number): void {
    const images = this.getTemoignageImages(id);
    if (!images || images.length <= 1) return;

    const state = this.carouselStates.get(id) || { currentIndex: 0, timer: null };

    if (state.timer) clearInterval(state.timer);

    state.timer = setInterval(() => {
      const next = (state.currentIndex + 1) % images.length;
      this.goToSlide(id, next);
    }, this.autoDelay);

    this.carouselStates.set(id, state);
  }

  // Arrêter l'auto-défilement
  stopCarousel(id: number): void {
    const state = this.carouselStates.get(id);
    if (state?.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
  }

  // Aller à un slide spécifique
  goToSlide(id: number, index: number): void {
    const state = this.carouselStates.get(id);
    if (state) {
      state.currentIndex = index;
      this.carouselStates.set(id, state);
    }
  }

  // Slide suivant
  nextSlide(id: number, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const images = this.getTemoignageImages(id);
    if (!images || images.length === 0) return;

    const state = this.carouselStates.get(id) || { currentIndex: 0, timer: null };
    const next = (state.currentIndex + 1) % images.length;
    this.goToSlide(id, next);
    this.pauseAndResume(id);
  }

  // Slide précédent
  prevSlide(id: number, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const images = this.getTemoignageImages(id);
    if (!images || images.length === 0) return;

    const state = this.carouselStates.get(id) || { currentIndex: 0, timer: null };
    const prev = (state.currentIndex - 1 + images.length) % images.length;
    this.goToSlide(id, prev);
    this.pauseAndResume(id);
  }

  // Pause puis reprise
  pauseAndResume(id: number): void {
    this.stopCarousel(id);
    setTimeout(() => this.startCarousel(id), this.autoDelay);
  }

  // Obtenir l'index courant
  getCurrentIndex(id: number): number {
    return this.carouselStates.get(id)?.currentIndex || 0;
  }

  // Obtenir les images d'un témoignage
  getTemoignageImages(id: number): string[] | undefined {
    const t = this.temoignages.find(t => t.id === id);
    return t?.images;
  }

  // Vérifier si une image est active
  isImageActive(id: number, index: number): boolean {
    return this.getCurrentIndex(id) === index;
  }

  // Compter les images
  getImageCount(id: number): number {
    return this.getTemoignageImages(id)?.length || 0;
  }

  // Vérifier si plusieurs images
  hasMultipleImages(id: number): boolean {
    return (this.getTemoignageImages(id)?.length || 0) > 1;
  }

  // Obtenir l'initiale pour l'avatar
  getInitials(temoignage: Temoignage): string {
    if (temoignage.nom_complet) {
      return temoignage.nom_complet.substring(0, 2).toUpperCase();
    }
    if (temoignage.user) {
      return `${(temoignage.user.prenom?.[0] || '')}${(temoignage.user.nom?.[0] || '')}`.toUpperCase();
    }
    return 'CL';
  }

  // Ouvrir la modal vidéo
  openVideoModal(videoUrl: string): void {
    const embedUrl = this.temoignageService.getYoutubeEmbedUrl(videoUrl);
    this.currentVideoUrl = embedUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl) : null;
    this.currentVideoExternalUrl = videoUrl;
    this.showVideoModal = true;
    document.body.style.overflow = 'hidden';
  }

  // Fermer la modal vidéo
  closeVideoModal(): void {
    this.showVideoModal = false;
    this.currentVideoUrl = null;
    document.body.style.overflow = '';
  }

  // Ouvrir la lightbox
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

  // Fermer les modals avec Echap
  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.showVideoModal) this.closeVideoModal();
    if (this.showLightbox) this.closeLightbox();
  }

  // Formater la date
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
