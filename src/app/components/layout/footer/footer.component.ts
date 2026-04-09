import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {

  currentYear = new Date().getFullYear();

  // Réseaux sociaux
  socialLinks = [
    {
      title: 'Snapchat',
      url: 'https://www.snapchat.com/@biosen100',
      svgPath: 'M12.166 3C9.979 3 6.95 4.38 6.95 8.026c0 .424.044.858.044.858s-.31.167-.789.167c-.555 0-1.136-.333-1.136-.333s-.07.265-.07.508c0 .758.649 1.312 1.547 1.503-.223.29-.37.649-.37 1.044 0 .98.817 1.73 1.956 1.73.272 0 .53-.05.766-.14C9.293 14.73 10.55 15.84 12 16c1.45-.16 2.707-1.27 3.102-2.637.236.09.494.14.766.14 1.139 0 1.956-.75 1.956-1.73 0-.395-.147-.754-.37-1.044.898-.19 1.547-.745 1.547-1.503 0-.243-.07-.508-.07-.508s-.581.333-1.136.333c-.479 0-.789-.167-.789-.167s.044-.434.044-.858C17.05 4.38 14.021 3 12.166 3z',
      iconType: 'svg'
    },
    {
      title: 'TikTok',
      url: 'https://www.tiktok.com/@biosen100',
      svgPath: 'M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 0 006.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.52V6.76a4.85 4.85 0 01-1.02-.07z',
      iconType: 'svg'
    },
    { title: 'Instagram', url: 'https://www.instagram.com/biosen100/', icon: 'bi bi-instagram', iconType: 'class' },
    { title: 'WhatsApp', url: 'https://whatsapp.com', icon: 'bi bi-whatsapp', iconType: 'class' },
  ];

  // Liens principaux (identiques à la navbar)
  infoLinks = [
    { label: 'Accueil', route: '/' },
    { label: 'Boutique', route: '/boutique' },
    { label: 'Témoignages et Conseils', route: '/temoignages' },
    { label: 'Sport', route: '/sport' },
    { label: 'Contact', route: '/contact' }
  ];

  // Méthodes de paiement
  paymentMethods = [
    { src: '/payments/expresso.png', alt: 'Expresso' },
    { src: '/payments/fremoney.png', alt: 'Free Money' },
    { src: '/payments/wave.png', alt: 'Wave' },
    { src: '/payments/Orange-Money.png', alt: 'Orange Money' }
  ];

  // Gestionnaire d'erreur d'image
  onImgError(event: Event) {
    const img = event.target as HTMLImageElement;
    console.warn('⚠️ Image introuvable :', img.src);
    img.style.display = 'none';
  }
}