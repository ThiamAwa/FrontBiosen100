export interface Categorie {
  id: number;
  nom: string;
  type_categorie_id?: number;
  typeCategorie?: TypeCategorie;
}

export interface TypeCategorie {
  id: number;
  nom: string;
}

export interface Gamme {
  id: number;
  nom: string;
  description?: string;
  prix?: number;
  prixPromo?: number;
  image?: string;
  produits_count?: number;
  produits?: Produit[];
}

export interface Produit {
  id: number;
  nom: string;
  description?: string;
  prix?: number;
  prixPromo?: number;
  stock: number;
  enPromotion: boolean;
  image?: string;
  categorie_id?: number;
  categorie?: Categorie;
  gammes?: Gamme[];
  created_at: string;
}

export interface AccueilData {
  produits: Produit[];
  produitsPromo: Produit[];
  gammes: Gamme[];
  categories: Categorie[];
  typeCategories: TypeCategorie[];
  vendeurs: Vendeur[];
  stats: Stats;
}

export interface Vendeur {
  id: number;
  nom: string;
  prenom?: string;
  telephone: string;
}

export interface Stats {
  total_produits: number;
  total_gammes: number;
  total_categories: number;
  produits_promo: number;
}
