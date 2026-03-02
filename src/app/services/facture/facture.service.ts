import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Facture, FacturePagination, CreateFactureDto, UpdateFactureDto } from '../../models/facture';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FactureService {

  private apiUrl = `${environment.apiUrl}/admin/factures`;

  constructor(private http: HttpClient) { }

  // GET /factures
  getAll(filters: any = {}): Observable<FacturePagination> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val) params = params.set(key, val as string);
    });
    return this.http.get<FacturePagination>(this.apiUrl, { params });
  }

  // GET /factures/:id
  getById(id: number): Observable<Facture> {
    return this.http.get<Facture>(`${this.apiUrl}/${id}`);
  }

  // POST /factures
  create(dto: CreateFactureDto): Observable<Facture> {
    return this.http.post<Facture>(this.apiUrl, dto);
  }

  // PUT /factures/:id
  update(id: number, dto: UpdateFactureDto): Observable<Facture> {
    return this.http.put<Facture>(`${this.apiUrl}/${id}`, dto);
  }

  // DELETE /factures/:id
  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  // GET /factures/:id/download
  downloadPdf(id: number, numeroFacture: string): void {
    this.http.get(`${this.apiUrl}/${id}/download`, { responseType: 'blob' })
      .subscribe(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `facture_${numeroFacture}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      });
  }
}