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

    // ✅ Les deux formes couvertes (Laravel camelCase → mappé en snake_case côté backend)
    commandes_sum_montant_total?: number;   // après ->through() dans le controller
    commandes_sum_montantTotal?: number;    // fallback si mapping absent

    // ✅ Dernière commande (les deux formes)
    derniere_commande?: string;             // alias propre après ->through()
    commandes_max_created_at?: string;      // valeur brute Laravel withMax()
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
    dernieres_commandes: ClientCommande[];
}

export interface ClientCommande {
    id: number;
    reference: string;
    date: string;
    montant: number;
    statut: 'en_cours' | 'valider' | 'annuler' | 'en_attente';
}