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