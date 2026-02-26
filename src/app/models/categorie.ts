export interface Categorie {
    id: number;
    nom: string;
    description: string;
    type_categorie_id?: number;
    type_categorie?: { id: number; nom: string };
    created_at?: string;
    updated_at?: string;
}