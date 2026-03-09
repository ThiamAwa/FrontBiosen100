import { Commande } from './commande';

// ── Metadonnees client ────────────────────────────────────────────
// Ancienne structure (sous-objet "client") — conservée pour rétrocompat
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
    quantite: number;
    prix: number;
    prix_unitaire?: number;  // alias selon la version du checkout
    total?: number;
}

// ── Metadonnees complètes ─────────────────────────────────────────
// Structure actuelle du checkout Laravel :
//   metadonnees.nom_client      = "Prenom Nom" (chaîne complète)
//   metadonnees.telephone_client
//   metadonnees.adresse_client
//   metadonnees.email            (optionnel)
//   metadonnees.total
//   metadonnees.sous_total
//   metadonnees.frais_livraison
//   metadonnees.methode_paiement
//   metadonnees.pays
//   metadonnees.produits[]
//
// Ancienne structure (rétrocompat) :
//   metadonnees.client.nom / .prenom / .email / .telephone / .adresse
export interface Metadonnees {
    // ── Structure actuelle (checkout courant) ──
    nom_client?: string;          // "Prenom Nom" — champ principal
    telephone_client?: string;
    adresse_client?: string;
    email?: string;
    total?: number;
    sous_total?: number;
    frais_livraison?: number;
    methode_paiement?: string;
    pays?: string;
    produits?: MetadonneesProduit[];

    // ── Ancienne structure (rétrocompat) ──
    client?: MetadonneesClient;
}

// ── Facture ──────────────────────────────────────────────────────
export interface Facture {
    id: number;
    commande_id: number;
    numero_facture: string;
    date_emission?: string;
    date_echeance: string;
    statut_paiement: 'payé' | 'impayé' | 'en_attente';
    metadonnees?: Metadonnees;
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