import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Vendeur {
  id: number;
  nom: string;
  telephone: string;
  whatsapp?: string; // lien direct vers WhatsApp (ex: https://wa.me/221771234567)
  photo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VendeurService {
  private mockVendeurs: Vendeur[] = [
    {
      id: 1,
      nom: 'Fatou Seck',
      telephone: '+221 77 123 45 67',
      whatsapp: 'https://wa.me/221771234567',
      photo: 'assets/img/vendeurs/fatou.jpg'
    },
    {
      id: 2,
      nom: 'Ousmane Sow',
      telephone: '+221 78 987 65 43',
      whatsapp: 'https://wa.me/221789876543',
      photo: 'assets/img/vendeurs/ousmane.jpg'
    }
  ];

  constructor() { }

  // Récupère la liste de tous les vendeurs
  getVendeurs(): Observable<Vendeur[]> {
    return of(this.mockVendeurs);
  }

  // Récupère un vendeur par son ID
  getVendeurById(id: number): Observable<Vendeur | undefined> {
    return of(this.mockVendeurs.find(v => v.id === id));
  }

  // Récupère le premier vendeur (par défaut)
  getDefaultVendeur(): Observable<Vendeur | undefined> {
    return of(this.mockVendeurs[0]);
  }
}