export interface Temoignage {
  id: number;
  user_id?: number;
  nom_client?: string;
  gamme_id?: number;
  description?: string;
  video_url?: string;
  images?: string[];
  afficher: boolean;
  created_at: string;
  updated_at: string;

  // Relations chargées
  gamme?: {
    id: number;
    nom: string;
  };
  user?: {
    id: number;
    nom: string;
    prenom?: string;
  };

  // Propriété calculée pour l'affichage
  nom_complet?: string;
}
