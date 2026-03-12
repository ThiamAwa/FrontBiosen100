// src/app/models/commande.ts

export interface User {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
    adresse?: string;
    role_id?: number;
    created_at?: string;
    updated_at?: string;
}

export interface Gamme {
    id: number;
    nom: string;
    description?: string;
    image?: string;
}

export interface ProduitMedia {
    id: number;
    url?: string;
    chemin?: string;
    path?: string;
    type?: string;
    produit_id?: number;
}

export interface Produit {
    id: number;
    nom: string;
    prix: number;
    description?: string;
    image?: string;
    type?: string;
    categorie?: string;
    gamme_id?: number;
    gamme?: Gamme;
    produitMedias?: ProduitMedia[];
}

export interface LignePanier {
    id?: number;
    quantite: number;
    prixUnitaire: number;
    prix?: number;
    type?: string;
    produit_id?: number;
    produit?: Produit;
    gamme?: Gamme;
}

export interface Panier {
    id: number;
    user_id?: number;
    statut?: string;
    quantite?: number;
    prixPanier?: number;
    lignesPanier?: LignePanier[];
    produit?: Produit;
    created_at?: string;
    updated_at?: string;
}

export interface Livraison {
    id: number;
    zone?: string;
    statut?: string;
    telephone?: string;
    frais?: number;
    commande_id?: number;
    user_id?: number;
    pays?: string;
    adresse?: string;
    nom_client?: string;
    prenom_client?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Facture {
    id: number;
    commande_id: number;
    numero_facture: string;
    date_emission: string;
    date_echeance: string;
    statut_paiement: string;
    metadonnees?: FactureMetadonnees;
    created_at?: string;
    updated_at?: string;
}

export interface FactureMetadonnees {
    produits?: ProduitFacture[];
    sous_total?: number;
    frais_livraison?: number;
    total?: number;
    methode_paiement?: string;
    nom_client?: string;
    telephone_client?: string;
    adresse_client?: string;
    pays?: string;
    email?: string;
    client?: {
        nom?: string;
        prenom?: string;
        email?: string;
        telephone?: string;
        tel?: string;
        phone?: string;
        adresse?: string;
    };
}

export interface ProduitFacture {
    id?: number;
    nom: string;
    quantite: number;
    prix_unitaire?: number;
    prix?: number;
    price?: number;
    total?: number;
    type?: string;
    categorie?: string;
    image?: string;
}

export interface ProduitCommande {
    id?: number;
    nom?: string;
    name?: string;
    quantite?: number;
    quantity?: number;
    prix_unitaire?: number;
    price?: number;
    prix?: number;
    total?: number;
    type?: string;
    categorie?: string;
    category?: string;
    image?: string;
}

export interface Boutique {
    id: number;
    nom: string;
    adresse?: string;
    telephone?: string;
}

export interface Commande {
    id: number;
    numeroCommande: string;
    montantTotal: number;
    statut: string;
    noteCommande?: string;
    email?: string;
    nom_client?: string;
    prenom_client?: string;
    telephone_client?: string;
    adresse_client?: string;
    pays?: string;
    ville_zone?: string;
    code_postal?: string;
    region?: string;
    methode_paiement?: string;
    is_guest?: boolean;

    // ── Produits JSON (stocké en BDD) ──
    produits?: ProduitCommande[] | string;

    // ── Relations ──
    user?: User;
    panier?: Panier;
    livraison?: Livraison;
    facture?: Facture;
    boutique?: Boutique;

    created_at?: string;
    updated_at?: string;
}

export interface CommandeResponse {
    data: Commande[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    from?: number;
    to?: number;
}