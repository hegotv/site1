import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { Video, ApiSearchResponse } from '../shared/interfaces'; // Assicurati del percorso corretto

@Injectable({
  providedIn: 'root', // Questo rende il servizio disponibile a livello globale
})
export class SearchService {
  private apiUrl = 'https://hegobck-production.up.railway.app'; // Utilizza l'URL base definito nell'environment

  constructor(private http: HttpClient) {}

  /**
   * Esegue una ricerca di video basata su una query.
   * @param query La stringa di ricerca.
   * @returns Un Observable di un array di Video.
   */
  searchVideos(query: string): Observable<Video[]> {
    if (!query.trim()) {
      // Se la query è vuota o solo spazi, restituisci un Observable vuoto
      return of([]);
    }

    let params = new HttpParams().set('query', query);

    // Esempio di endpoint di ricerca: /api/videos/search?query=...
    return this.http
      .get<ApiSearchResponse>(`${this.apiUrl}/video/search`, { params })
      .pipe(
        map((response) => {
          // Assicurati che la struttura della risposta API sia corretta.
          // Se i video sono in response.data.videos, allora usa quello.
          return response.data.videos || [];
        }),
        catchError((error) => {
          // Errore durante la ricerca
          // Potresti voler passare un errore più specifico o un array vuoto
          return of([]); // Restituisce un array vuoto in caso di errore
        })
      );
  }
}
