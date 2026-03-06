import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Client, ClientResponse } from '../../models/client';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private apiUrl = `${environment.apiUrl}/admin/clients`;

  constructor(private http: HttpClient) { }

  getClients(
    page: number = 1,
    search: string = '',
    statut: string = '',
    tri: string = ''
  ): Observable<ClientResponse> {
    let params = new HttpParams().set('page', page.toString());
    if (search) params = params.set('search', search);
    if (statut) params = params.set('statut', statut);  // ← remplacer filter par statut
    if (tri) params = params.set('tri', tri);         // ← ajouter tri
    return this.http.get<ClientResponse>(this.apiUrl, { params });
  }

  getClient(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/${id}`);
  }

  createClient(data: Partial<Client>): Observable<Client> {
    return this.http.post<Client>(this.apiUrl, data);
  }

  updateClient(id: number, data: Partial<Client>): Observable<Client> {
    return this.http.put<Client>(`${this.apiUrl}/${id}`, data);
  }

  deleteClient(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }



  getStats(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}/stats`);
  }


  updateStatut(id: number, statut: 'actif' | 'suspendu'): Observable<{ message: string; statut: string }> {
    return this.http.patch<{ message: string; statut: string }>(
      `${this.apiUrl}/${id}/statut`,
      { statut }
    );
  }
}