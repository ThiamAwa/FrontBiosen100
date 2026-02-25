// models/produit-sport.model.ts
export interface ProduitMedia {
  id: number;
  type: 'image' | 'video_url';
  chemin?: string;        // Pour les images
  url?: string;           // URL complète de l'image (générée par Laravel)
  url_externe?: string;   // URL YouTube/Vimeo
  embed_url?: string;     // URL embed
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
  image?: string;  // Image principale (legacy)
  categorie?: Categorie;
  medias: ProduitMedia[];
  created_at: string;
}

export interface ProduitSportResponse {
  produits: {
    data: ProduitSport[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  categories: Categorie[];
}
