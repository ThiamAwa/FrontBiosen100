export interface Boutique {
    id: number;
    nom: string;
    adresse: string;
    localisation: string;
    created_at?: string;
    updated_at?: string;
    users_count?: number;
    users?: {
        id: number;
        nom: string;
        prenom: string;
        email?: string;
        telephone?: string;
        role?: { id: number; name: string }
    }[];
}

export interface BoutiqueResponse {
    data: Boutique[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}