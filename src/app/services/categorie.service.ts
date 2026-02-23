import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Categorie {
  id: number;
  nom: string;
  description?: string;
  image?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategorieService {
  private mockCategories: Categorie[] = [
    { id: 1, nom: 'Huiles Essentielles', description: 'Huiles pures et naturelles' },
    { id: 2, nom: 'Produits de la ruche', description: 'Miel, propolis, etc.' },
    { id: 3, nom: 'Soins du corps', description: 'Savons, beurres, lotions' },
    { id: 4, nom: 'Compléments Alimentaires', description: 'Pour votre bien-être' }
  ];

  constructor() { }

  getCategories(): Observable<Categorie[]> {
    return of(this.mockCategories);
  }

  getCategorieById(id: number): Observable<Categorie | undefined> {
    return of(this.mockCategories.find(c => c.id === id));
  }
}