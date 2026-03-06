import { Commande } from './commande';

// ── Metadonnees ──────────────────────────────────────────────────
export interface MetadonneesClient {
    nom?: string;
    prenom?: string;
    email?: string;
    telephone?: string;
    tel?: string;
    phone?: string;
    adresse?: string;
}

export interface MetadonneesProduit {
    nom: string;
    quantite: number;   // ← number uniquement, plus de string
    prix: number;       // ← number uniquement, plus de string
}

export interface Metadonnees {
    client: MetadonneesClient;       // ← non-optionnel
    produits: MetadonneesProduit[];  // ← non-optionnel
}

// ── Facture ──────────────────────────────────────────────────────
export interface Facture {
    id: number;
    commande_id: number;
    numero_facture: string;
    date_emission?: string;
    date_echeance: string;
    statut_paiement: 'payé' | 'impayé' | 'en_attente';
    metadonnees: Metadonnees;
    commande?: Commande;
    created_at?: string;
    updated_at?: string;
}

// ── DTOs ─────────────────────────────────────────────────────────
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