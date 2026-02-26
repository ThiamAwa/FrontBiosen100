import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Gamme } from '../../models/gamme';

export interface TypeCategorie {
  id: number;
  nom: string;
}

export interface GammePagination {
  data: Gamme[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

@Injectable({ providedIn: 'root' })
export class GammeService {
  private apiUrl = 'http://localhost:8000/api/admin/gammes';

  constructor(private http: HttpClient) { }

  getAll(page: number = 1, search: string = ''): Observable<GammePagination> {
    let params = new HttpParams().set('page', page);
    if (search) params = params.set('search', search);
    return this.http.get<GammePagination>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Gamme> {
    return this.http.get<Gamme>(`${this.apiUrl}/${id}`);
  }

  create(data: FormData): Observable<Gamme> {
    return this.http.post<Gamme>(this.apiUrl, data);
  }

  update(id: number, data: FormData): Observable<Gamme> {
    data.append('_method', 'PUT');
    return this.http.post<Gamme>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  buildFormData(gamme: Partial<Gamme>, imageFile?: File, videoFile?: File): FormData {
    const fd = new FormData();
    if (gamme.nom) fd.append('nom', gamme.nom);
    if (gamme.description) fd.append('description', gamme.description);
    if (gamme.modeUtilisation) fd.append('modeUtilisation', gamme.modeUtilisation);
    if (gamme.prix !== undefined) fd.append('prix', String(gamme.prix));
    if (gamme.stock !== undefined) fd.append('stock', String(gamme.stock));
    fd.append('enPromotion', gamme.enPromotion ? '1' : '0');
    if (gamme.prixPromo) fd.append('prixPromo', String(gamme.prixPromo));
    if (gamme.type_categorie_id) fd.append('type_categorie_id', String(gamme.type_categorie_id));
    if (imageFile) fd.append('image', imageFile);
    if (videoFile) fd.append('video', videoFile);
    return fd;
  }
}