import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Livreur, LivreurResponse } from '../../models/livreur';

@Injectable({
  providedIn: 'root'
})
export class LivreurService {
  private apiUrl = `${environment.apiUrl}/livreurs`;

  constructor(private http: HttpClient) { }

  getLivreurs(page: number = 1): Observable<LivreurResponse> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<LivreurResponse>(this.apiUrl, { params });
  }

  getLivreur(id: number): Observable<Livreur> {
    return this.http.get<Livreur>(`${this.apiUrl}/${id}`);
  }

  createLivreur(data: any): Observable<Livreur> {
    return this.http.post<Livreur>(this.apiUrl, data);
  }

  updateLivreur(id: number, data: any): Observable<Livreur> {
    return this.http.put<Livreur>(`${this.apiUrl}/${id}`, data);
  }

  deleteLivreur(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
