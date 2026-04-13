import { Component, OnInit, AfterViewInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HomeService } from '../../../services/home/home.service';

declare var AOS: any;

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit, AfterViewInit, OnDestroy {

  stats: any = {
    total_produits: 0,
    total_gammes: 0,
    total_categories: 0,
    produits_promo: 0
  };

  private observer: IntersectionObserver | null = null;

  constructor(
    private accueilService: HomeService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    setTimeout(() => {
      this.initAOS();
      this.initCounters();
    }, 300);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  loadStats(): void {
    this.accueilService.getAccueilData().subscribe({
      next: (response) => {
        this.stats = response.stats || this.stats;
        // Relancer les counters après chargement des stats
        setTimeout(() => this.initCounters(), 400);
      },
      error: (err) => {
        console.error('Erreur chargement stats about:', err);
      }
    });
  }

  initAOS(): void {
    if (typeof AOS !== 'undefined') {
      AOS.init({ duration: 900, once: true, offset: 80 });
    }
  }

  initCounters(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const counters = document.querySelectorAll('.counter');
    const speed = 200;

    const animateCounter = (counter: Element) => {
      const target = parseInt(counter.getAttribute('data-target') || '0', 10);
      const count = parseInt(counter.textContent?.replace('+', '') || '0', 10);
      const increment = Math.ceil(target / speed);

      if (count < target) {
        counter.textContent = Math.min(count + increment, target).toString();
        setTimeout(() => animateCounter(counter), 10);
      } else {
        counter.textContent = target === 100 ? `${target}%` : `${target}+`;
      }
    };

    this.observer?.disconnect();

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          this.observer?.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    counters.forEach(counter => this.observer?.observe(counter));
  }
}