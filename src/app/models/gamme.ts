export interface Gamme {
    id: number;
    image?: string | null;
    video?: string | null;
    nom: string;
    description?: string | null;
    modeUtilisation?: string | null;
    prix: number;
    enPromotion: boolean;
    prixPromo?: number | null;
    stock: number;
    type_categorie_id?: number | null;
    type_categorie?: { id: number; nom: string };
    produits_count?: number;
    created_at?: string;
    updated_at?: string;
}