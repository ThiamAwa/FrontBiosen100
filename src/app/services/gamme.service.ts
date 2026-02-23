import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

// Interface pour un produit (si vous voulez typer les produits dans une gamme)
export interface Produit {
  id: number;
  nom: string;
  prix?: number;
}

export interface Gamme {
  id: number;
  nom: string;
  description?: string;
  image?: string;
  produits_count?: number;
  prix?: number;
  produits?: Produit[]; // optionnel
}

@Injectable({
  providedIn: 'root'
})
export class GammeService {
  private mockGammes: Gamme[] = [
    {
      id: 1,
      nom: 'Huiles Essentielles',
      description: 'Huiles pures et naturelles extraites de plantes sénégalaises',
      image: 'assets/img/gammes/huiles.jpg',
      produits_count: 5,
      prix: 5000
    },
    {
      id: 2,
      nom: 'Compléments Alimentaires',
      description: 'Pour votre bien-être quotidien, à base de plantes locales',
      image: 'assets/img/gammes/complements.jpg',
      produits_count: 8,
      prix: 3500
    },
    {
      id: 3,
      nom: 'Soins Corps',
      description: 'Cosmétiques bio pour une peau éclatante',
      image: 'assets/img/gammes/soins.jpg',
      produits_count: 6,
      prix: 4500
    }
  ];

  constructor() { }

  // Retourne toutes les gammes
  getGammes(): Observable<Gamme[]> {
    return of(this.mockGammes);
  }

  // Retourne une gamme par son ID
  getGammeById(id: number): Observable<Gamme | undefined> {
    return of(this.mockGammes.find(g => g.id === id));
  }

  // Optionnel : retourne les produits associés à une gamme
  // (à connecter avec votre API ou service produit)
  getProduitsByGamme(gammeId: number): Observable<Produit[]> {
    // Simule quelques produits (à adapter)
    const mockProduits: Produit[] = [
      { id: 101, nom: 'Huile de Baobab', prix: 2500 },
      { id: 102, nom: 'Huile de Neem', prix: 2200 }
    ];
    return of(mockProduits);
  }
}