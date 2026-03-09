import {TypeCategorie} from './type-categorie';

export interface ProduitMedia {
  id: number;
  type: 'image' | 'video_url';
  chemin?: string;
  url?: string;
  url_externe?: string;
  embed_url?: string;
  youtube_thumbnail?: string;
  titre?: string;
  est_principal: boolean;
  ordre: number;
}

export interface Categorie {
  id: number;
  nom: string;
}

export interface ProduitSport {
  id: number;
  nom: string;
  description?: string;
  prix: number;
  prixPromo?: number;
  stock: number;
  enPromotion: boolean;
  image?: string;
  categorie_id?: number;
  categorie?: Categorie;
  medias?: ProduitMedia[];
  created_at: string;
  avis?: any[];
}

export interface ProduitSportResponse {
  produits: {
    data: ProduitSport[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  typeCategories: TypeCategorie[];
}
