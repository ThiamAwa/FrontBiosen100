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
    { title: 'Snapchat', url: 'https://www.snapchat.com/@biosen100', icon: 'bi bi-snapchat' },
    { title: 'TikTok', url: 'https://www.tiktok.com/@biosen100', icon: 'bi bi-tiktok' },
    { title: 'Instagram', url: 'https://www.instagram.com/biosen100/', icon: 'bi bi-instagram' },
    { title: 'WhatsApp', url: 'https://whatsapp.com', icon: 'bi bi-whatsapp' },
    // { title: 'Facebook', url: 'https://facebook.com', icon: 'bi bi-facebook' },
    // { title: 'Twitter', url: 'https://twitter.com', icon: 'bi bi-twitter-x' }
  ];

  // Si tu veux ajouter un deuxième compte TikTok (biosen100thies) :
  // socialLinks = [
  //   ...
  //   { title: 'TikTok (principal)', url: 'https://www.tiktok.com/@biosen100', icon: 'bi bi-tiktok' },
  //   { title: 'TikTok Thies', url: 'https://www.tiktok.com/@biosen100thies', icon: 'bi bi-tiktok' },
  //   ...
  // ];

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