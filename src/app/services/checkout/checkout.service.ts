import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CheckoutData {
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  pays: string;
  adresse: string;
  zone_livraison?: string;
  code_postal?: string;
  ville?: string;
  region?: string;
  notes?: string;
  cart_data: string;
  shipping_cost: number;
  create_account?: boolean;
  password?: string;
  terms: boolean;
}

export interface CommandeResponse {
  message: string;
  order_number: string;
  commande_id: number;
  token?: string;
  whatsapp_message: string;
}

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /** Soumettre une commande */
  submitOrder(data: CheckoutData): Observable<CommandeResponse> {
    return this.http.post<CommandeResponse>(`${this.apiUrl}/checkout`, data);
  }

  /** Récupérer les informations d'une commande */
  getOrder(orderNumber: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/checkout/confirmation/${orderNumber}`);
  }

  /** Vérifier le statut d'une commande */
  checkOrderStatus(orderNumber: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/checkout/status/${orderNumber}`);
  }

  /** Obtenir le message WhatsApp pour une commande */
  getWhatsAppMessage(orderNumber: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/checkout/whatsapp/${orderNumber}`);
  }

  /** Télécharger la facture PDF */
  downloadInvoice(orderNumber: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/checkout/pdf/${orderNumber}`, {
      responseType: 'blob'
    });
  }
}
