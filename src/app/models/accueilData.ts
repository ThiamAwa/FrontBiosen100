import {Produit} from './produit';
import {TypeCategorie} from './type-categorie';
import {Categorie} from './categorie';
import {Gamme} from './gamme';
import {Vendeur} from './vendeur';
import {Stats} from './stats';
import {ProduitSport} from './produit-sport';

export interface AccueilData {
  produits: Produit[];
  produitsPromo: Produit[];
  gammes: Gamme[];
  categories: Categorie[];
  typeCategories: TypeCategorie[];
  produitsSport: ProduitSport[];
  vendeurs: Vendeur[];
  stats: Stats;
}
