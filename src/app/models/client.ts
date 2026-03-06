export interface Client {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    adresse?: string;
    role_id: number;
    role?: { id: number; name: string };
    email_verified_at?: string;
    created_at?: string;
    updated_at?: string;


    statut?: 'actif' | 'suspendu';
    commandes_count?: number;
    commandes_sum_montant_total?: number;
    total_commandes?: number;
    total_depense?: number;
    derniere_commande?: string;
}

export interface ClientResponse {
    data: Client[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
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