import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Vendeur } from '../../services/vendeur/vendeur.service';

@Component({
  selector: 'app-whatsapp',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './whatsapp.component.html',
  styleUrls: ['./whatsapp.component.css']
})
export class WhatsappComponent {
  @Input() vendeurs: Vendeur[] | null = [];

  get whatsappLink(): string {
    if (this.vendeurs && this.vendeurs.length > 0) {
      // Si le vendeur a un lien whatsapp, l'utiliser, sinon construire depuis le téléphone
      return this.vendeurs[0].whatsapp || `https://wa.me/${this.vendeurs[0].telephone.replace(/\s/g, '')}`;
    }
    return 'https://wa.me/221771234567'; // lien par défaut
  }
}