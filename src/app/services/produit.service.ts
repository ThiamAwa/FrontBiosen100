import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Produit {
  id: number;
  nom: string;
  description?: string;
  image?: string;
  prix?: number;
  prixPromo?: number;
  enPromotion?: boolean;
  categorie_id: number;
  categorie_nom?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProduitService {
  private mockProduits: Produit[] = [
    {
      id: 1,
      nom: 'Huile de Baobab',
      description: 'Huile nourrissante riche en vitamines A et E',
      image: 'assets/img/produits/baobab.jpg',
      prix: 2500,
      categorie_id: 1,
      categorie_nom: 'Huiles Essentielles'
    },
    {
      id: 2,
      nom: 'Miel Naturel de Casamance',
      description: 'Miel pur, récolté artisanalement',
      image: 'assets/img/produits/miel.jpg',
      prix: 3500,
      enPromotion: true,
      prixPromo: 3000,
      categorie_id: 2,
      categorie_nom: 'Produits de la ruche'
    },
    {
      id: 3,
      nom: 'Savon au Beurre de Karité',
      description: 'Savon doux pour peaux sensibles',
      image: 'assets/img/produits/savon.jpg',
      prix: 1500,
      categorie_id: 3,
      categorie_nom: 'Soins du corps'
    },
    {
      id: 4,
      nom: 'Huile de Coco Vierge',
      description: 'Pour la cuisine et les soins',
      image: 'assets/img/produits/coco.jpg',
      prix: 2000,
      categorie_id: 1,
      categorie_nom: 'Huiles Essentielles'
    },
    {
      id: 5,
      nom: 'Poudre de Moringa',
      description: 'Super-aliment riche en nutriments',
      image: 'assets/img/produits/moringa.jpg',
      prix: 1800,
      enPromotion: true,
      prixPromo: 1500,
      categorie_id: 4,
      categorie_nom: 'Compléments Alimentaires'
    }
  ];

  constructor() { }

  // Récupérer tous les produits
  getProduits(): Observable<Produit[]> {
    return of(this.mockProduits);
  }

  // Récupérer un produit par son ID
  getProduitById(id: number): Observable<Produit | undefined> {
    return of(this.mockProduits.find(p => p.id === id));
  }

  // Récupérer les produits d'une catégorie spécifique
  getProduitsByCategorie(categorieId: number): Observable<Produit[]> {
    const produits = this.mockProduits.filter(p => p.categorie_id === categorieId);
    return of(produits);
  }

  // Optionnel : obtenir les produits en promotion
  getProduitsEnPromotion(): Observable<Produit[]> {
    const produits = this.mockProduits.filter(p => p.enPromotion);
    return of(produits);
  }

  // Autres méthodes CRUD si nécessaire...
}