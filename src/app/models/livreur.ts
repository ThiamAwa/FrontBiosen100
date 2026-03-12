
export interface Livreur {
    id: number;
    nom: string;
    prenom: string;
    telephone: string;
    adresse: string;
    created_at?: string;
    updated_at?: string;
}

export interface LivreurResponse {
    data: Livreur[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}