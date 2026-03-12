export interface Produit {
    id: number;
    image?: string | null;
    nom: string;
    description?: string | null;
    modeUtilisation?: string | null;
    prix: number;
    prixPromo?: number | null;
    enPromotion: boolean;
    stock: number;
    noteProduit?: number | null;
    categorie_id?: number | null;
    categorie?: {
        id: number;
        nom: string;
    } | null;
    gammes?: {
        id: number;
        nom: string;
    }[];
    created_at?: string;
    updated_at?: string;
}