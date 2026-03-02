export interface Facture {
    id: number;
    commande_id: number;
    numero_facture: string;
    date_emission: string;
    date_echeance: string;
    statut_paiement: 'payé' | 'impayé' | 'en_attente';
    metadonnees: Metadonnees;
    commande?: Commande;
    created_at?: string;
    updated_at?: string;
}

export interface Metadonnees {
    client: {
        nom: string;
        email: string;
        adresse: string;
    };
    produits: {
        nom: string;
        quantite: number;
        prix: number;
    }[];
}

export interface Commande {
    id: number;
    nom_client?: string;
    email?: string;
    montantTotal: number;
    user?: {
        nom: string;
        email: string;
    };
}

// DTOs
export interface CreateFactureDto {
    commande_id: number;
    statut_paiement?: 'payé' | 'impayé' | 'en_attente';
    date_echeance?: string;
}

export interface UpdateFactureDto {
    statut_paiement?: 'payé' | 'impayé' | 'en_attente';
    date_echeance?: string;
}

export interface FacturePagination {
    data: Facture[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}