// models/vendeur.model.ts

export interface Role {
    id: number;
    name: string;
}

export interface Boutique {
    id: number;
    nom: string;
    localisation?: string;
}

export interface Vendeur {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    adresse?: string | null;
    password_change_required?: boolean;
    role_id: number;
    role?: Role;
    boutique_id?: number | null;
    boutique?: Boutique | null;
    created_at?: string;
    updated_at?: string;
}