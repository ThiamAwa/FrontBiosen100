import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Boutique, BoutiqueResponse } from '../../models/boutique';

@Injectable({
  providedIn: 'root'
})
export class BoutiqueService {
  private apiUrl = `${environment.apiUrl}/admin/boutiques`;

  constructor(private http: HttpClient) { }

  getBoutiques(page: number = 1): Observable<BoutiqueResponse> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<BoutiqueResponse>(this.apiUrl, { params });
  }

  getBoutique(id: number): Observable<Boutique> {
    return this.http.get<Boutique>(`${this.apiUrl}/${id}`);
  }

  createBoutique(data: Partial<Boutique>): Observable<Boutique> {
    return this.http.post<Boutique>(this.apiUrl, data);
  }

  updateBoutique(id: number, data: Partial<Boutique>): Observable<Boutique> {
    return this.http.put<Boutique>(`${this.apiUrl}/${id}`, data);
  }

  deleteBoutique(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}