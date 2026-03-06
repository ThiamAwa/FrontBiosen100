export interface Boutique {
    id: number;
    nom: string;
    adresse?: string;
    localisation?: string;
}

export interface LignePanier {
    id?: number;
    quantite: number;
    prixUnitaire: number;
    gamme?: { id: number; nom: string };
}

export interface Panier {
    id: number;
    lignesPanier: LignePanier[];
}

export interface User {
    id: number;
    nom: string;
    prenom?: string;
    email: string;
    telephone?: string;
    adresse?: string;
}

export interface Commande {
    id: number;
    numeroCommande?: string;
    montantTotal?: number;
    user_id?: number;
    user?: User;
    panier_id?: number;
    panier?: Panier;
    boutique_id?: number;
    boutique?: Boutique;
    noteCommande?: string;
    statut: 'en_attente' | 'en_cours' | 'valider';
    created_at: string;
    updated_at: string;
}

export interface CommandeResponse {
    data: Commande[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}