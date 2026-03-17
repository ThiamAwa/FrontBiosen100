

export interface Client {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    adresse?: string;
    role_id?: number;
    role?: { id: number; name: string };

    statut?: 'actif' | 'suspendu';

    created_at?: string;
    updated_at?: string;
    email_verified_at?: string | null;

    // ─── Stats liste (retournées par index()) ────────────────────────────────
    commandes_count?: number;


    commandes_sum_montant_total?: number;
    commandes_sum_montantTotal?: number;

    derniere_commande?: string;
    commandes_max_created_at?: string;
}

export interface ClientResponse {
    data: Client[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

export interface ClientStats {
    total_commandes: number;
    commandes_en_cours: number;
    commandes_livrees: number;
    total_depense: number;
    total_avis: number;
    moyenne_avis: number;
    dernieres_commandes?: ClientCommande[];
}

// ─── Détail d'une commande dans la vue client ────────────────────────────────
export interface ClientCommande {
    id: number;
    reference: string;
    date: string;
    montant: number;
    statut: 'en_cours' | 'valider' | 'annuler' | 'en_attente';

    // ✅ Champs adresse de livraison
    adresse_client?: string;
    ville_zone?: string;
    code_postal?: string;
    region?: string;
    pays?: string;
    methode_paiement?: string;

    // ✅ Produits de la commande
    produits?: ClientCommandeProduit[];
}

// ─── Produit dans une commande client ────────────────────────────────────────
export interface ClientCommandeProduit {
    id?: number;
    nom: string;
    quantite: number;
    prix_unitaire?: number;
    prix?: number;
    price?: number;
    total?: number;
    type?: string;
    image?: string;
}