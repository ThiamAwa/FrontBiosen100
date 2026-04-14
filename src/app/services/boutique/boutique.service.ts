import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Boutique, BoutiqueResponse } from '../../models/boutique';

@Injectable({
  providedIn: 'root'
})
export class BoutiqueService {
  private apiUrl = `${environment.apiUrl}/boutiques`;

  constructor(private http: HttpClient) { }

  getBoutiques(page: number = 1): Observable<BoutiqueResponse> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<BoutiqueResponse>(this.apiUrl, { params });
  }

  getBoutique(id: number): Observable<Boutique> {
    return this.http.get<Boutique>(`${this.apiUrl}/${id}`);
  }

  // Pour la création avec upload d'image (multipart/form-data)
  createBoutiqueWithImage(formData: FormData): Observable<Boutique> {
    return this.http.post<Boutique>(this.apiUrl, formData);
  }

  // Pour la mise à jour avec upload d'image (multipart/form-data)
  updateBoutiqueWithImage(id: number, formData: FormData): Observable<Boutique> {
    formData.append('_method', 'PUT');
    return this.http.post<Boutique>(`${this.apiUrl}/${id}`, formData);
  }

  // Pour la création sans image (JSON) - si nécessaire
  createBoutique(data: Partial<Boutique>): Observable<Boutique> {
    return this.http.post<Boutique>(this.apiUrl, data);
  }

  // Pour la mise à jour sans image (JSON) - si nécessaire
  updateBoutique(id: number, data: Partial<Boutique>): Observable<Boutique> {
    return this.http.put<Boutique>(`${this.apiUrl}/${id}`, data);
  }

  deleteBoutique(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}