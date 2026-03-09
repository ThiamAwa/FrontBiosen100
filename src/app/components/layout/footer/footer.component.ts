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

  socialLinks = [
    { title: 'Facebook', url: 'https://facebook.com', icon: 'fab fa-facebook-f' },
    { title: 'Instagram', url: 'https://instagram.com', icon: 'fab fa-instagram' },
    { title: 'Twitter', url: 'https://twitter.com', icon: 'fab fa-twitter' },
    { title: 'WhatsApp', url: 'https://whatsapp.com', icon: 'fab fa-whatsapp' },
  ];

  infoLinks = [
    { label: 'Accueil', route: '/' },
    { label: 'À propos', route: '/about' },
    { label: 'Nos produits', route: '/shop' },
    { label: 'Contact', route: '/contact' },
    { label: 'Politique de confidentialité', route: '/privacy' },
    { label: "Conditions d'utilisation", route: '/terms' },
  ];


  paymentMethods = [
    { src: '/payments/expresso.png', alt: 'Expresso' },
    { src: '/payments/fremoney.png', alt: 'Free Money' },
    { src: '/payments/wave.png', alt: 'Wave' },
    { src: '/payments/Orange-Money.png', alt: 'Orange Money' },
  ];

  onImgError(event: Event) {
    const img = event.target as HTMLImageElement;
    console.error('❌ Image introuvable :', img.src);
    img.style.display = 'none';
  }
}