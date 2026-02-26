export interface TypeCategorie {
  id: number;
  nom: string;
}

export interface Produit {
  id: number;
  nom: string;
  description?: string;
  prix: number;
  prixPromo?: number;
  stock: number;
  enPromotion: boolean;
  image?: string;
  gamme_id: number;
}

export interface Gamme {
  id: number;
  nom: string;
  description?: string;
  modeUtilisation?: string;
  prix: number;
  prixPromo?: number;
  stock: number;
  enPromotion: boolean;
  image?: string;
  type_categorie_id?: number;
  typeCategorie?: TypeCategorie;
  produits?: Produit[];
  produits_count?: number;
}

export interface GammePaginated {
  data: Gamme[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface CartItem {
  id: number;
  nom: string;
  prix: number;
  image?: string;
  categorie: string;
  quantity: number;
}
