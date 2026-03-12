import { TypeCategorie } from './type-categorie';

export interface ProduitSport {
  id: number;
  nom: string;
  description: string | null;
  prix: number;
  prixPromo: number | null;
  stock: number;
  enPromotion: boolean;
  noteProduit: number | null;
  ordre: number;
  type_categorie_id: number | null;
  image: string[];        // ✅ JSON array — PAS un string
  video: string | null;
  typeCategorie?: TypeCategorie | null;
  created_at?: string;          // ✅ optionnel — pas toujours retourné
  updated_at?: string;          // ✅ optionnel

  // Champs calculés par le service (non en BDD)
  imageUrls?: string[];
  embedUrl?: string | null;
  thumbnail?: string | null;
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

export interface MediaItem {
  type: 'image' | 'video'; // ✅ PAS 'video_url'
  url: string;
  path?: string;
}

export interface MediasResponse {
  produit: { id: number; nom: string; typeCategorie: string | null };
  medias: {
    type: 'image' | 'video';
    url: string;
    path?: string;
  }[];
}


export type ProduitMedia = MediasResponse['medias'][number];