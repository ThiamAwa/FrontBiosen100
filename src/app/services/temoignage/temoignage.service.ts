import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Temoignage } from '../../models/temoignage';

@Injectable({
  providedIn: 'root'
})
export class TemoignageService {
  private apiUrl = environment.apiUrl;
  private storageUrl = environment.storageUrl;

  constructor(private http: HttpClient) { }

  // Récupérer tous les témoignages publics (pour la page témoignages)
  getTemoignagesPublics(): Observable<Temoignage[]> {
    return this.http.get<any[]>(`${this.apiUrl}/temoignages`).pipe(
      map(temoignages => temoignages.map(t => this.normalizeTemoignage(t)))
    );
  }

  // Pour l'admin 
  getTemoignagesAdmin(page: number = 1): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/temoignages?page=${page}`).pipe(
      map(response => ({
        ...response,
        temoignages: {
          ...response.temoignages,
          data: response.temoignages.data.map((t: any) => this.normalizeTemoignage(t))
        }
      }))
    );
  }

  // Créer un témoignage (admin)
  createTemoignage(formData: FormData): Observable<Temoignage> {
    return this.http.post<Temoignage>(`${this.apiUrl}/admin/temoignages`, formData).pipe(
      map(t => this.normalizeTemoignage(t))
    );
  }

  // Mettre à jour un témoignage (admin)
  updateTemoignage(id: number, formData: FormData): Observable<Temoignage> {
    // Important: utiliser POST avec _method=PUT pour Laravel
    formData.append('_method', 'PUT');
    return this.http.post<Temoignage>(`${this.apiUrl}/admin/temoignages/${id}`, formData).pipe(
      map(t => this.normalizeTemoignage(t))
    );
  }

  // Supprimer un témoignage (admin)
  deleteTemoignage(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/temoignages/${id}`);
  }

  // Obtenir les gammes pour le formulaire admin
  getGammes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/gammes`);
  }

  // Obtenir les clients pour le formulaire admin
  getClients(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/clients`);
  }

  // Normaliser un témoignage
  private normalizeTemoignage(temoignage: any): Temoignage {
    // Ajouter le nom complet
    let nom_complet = '';
    if (temoignage.user) {
      nom_complet = `${temoignage.user.prenom || ''} ${temoignage.user.nom || ''}`.trim();
    } else if (temoignage.nom_client) {
      nom_complet = temoignage.nom_client;
    }

    // Transformer les images en URLs complètes
    if (temoignage.images && Array.isArray(temoignage.images)) {
      temoignage.images = temoignage.images.map((img: string) =>
        img.startsWith('http') ? img : `${this.storageUrl}/${img}`
      );
    }

    return {
      ...temoignage,
      nom_complet
    };
  }

  // Extraire l'ID YouTube d'une URL
  extractYoutubeId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  // Obtenir l'URL d'embed YouTube
  getYoutubeEmbedUrl(url: string): string | null {
    const id = this.extractYoutubeId(url);
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : null;
  }
}
