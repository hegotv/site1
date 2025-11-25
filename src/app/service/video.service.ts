import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Video, ApiDataResponse } from '../shared/interfaces';

// --- Interfacce per risposte API specifiche (invariate) ---

export interface DetailedVideo extends Video {
  isSaved: boolean | null;
  last_position_seconds?: number;
  is_completed?: boolean;
}

interface ApiResponse<T> {
  response: string;
  data: T;
}

interface ApiListResponse<T> {
  response: string;
  list: T[];
}

@Injectable({
  providedIn: 'root',
})
export class VideoService {
  private readonly apiUrl = 'https://hegobck-production.up.railway.app/video';

  constructor(private http: HttpClient) {}

  // ===================================================================
  // METODI DI LETTURA DATI
  // ===================================================================

  /**
   * Recupera i dati aggregati per la home page.
   * Questa chiamata è pubblica e non necessita di autenticazione.
   */
  getHomeData(): Observable<ApiDataResponse> {
    return this.http
      .get<ApiResponse<ApiDataResponse>>(`${this.apiUrl}/getVideos/`)
      .pipe(map((response) => response.data));
  }

  /**
   * Recupera i dettagli di un singolo video.
   * L'autenticazione è gestita dall'interceptor.
   */
  getVideo(id: string): Observable<DetailedVideo> {
    // --- CORREZIONE: Rimosso { withCredentials: true } ---
    return this.http
      .post<ApiResponse<DetailedVideo>>(`${this.apiUrl}/getVideo/`, { id })
      .pipe(map((response) => response.data));
  }

  /**
   * Recupera la lista dei video da "Continua a guardare".
   * L'autenticazione è gestita dall'interceptor.
   */
  getContinueWatchingVideos(): Observable<Video[]> {
    // --- CORREZIONE: Rimosso { withCredentials: true } ---
    return this.http
      .get<ApiListResponse<Video>>(`${this.apiUrl}/continue_watching/`)
      .pipe(
        map((response) => response.list || []),
        catchError(() => of([]))
      );
  }

  /**
   * Recupera la lista dei video preferiti dell'utente.
   * L'autenticazione è gestita dall'interceptor.
   */
  getFavoriteVideos(): Observable<Video[]> {
    // --- CORREZIONE: Rimosso { withCredentials: true } ---
    return this.http
      .get<ApiListResponse<Video>>(`${this.apiUrl}/getSavedVideos/`)
      .pipe(
        map((response) => response.list || []),
        catchError(() => of([]))
      );
  }

  // ===================================================================
  // METODI DI SCRITTURA DATI
  // ===================================================================

  /**
   * Registra una visualizzazione per un video.
   * L'autenticazione è gestita dall'interceptor.
   */
  addView(id: string): Observable<unknown> {
    // --- CORREZIONE: Rimosso { withCredentials: true } ---
    return this.http.post(`${this.apiUrl}/setVisual/`, { id });
  }

  /**
   * Salva un video nei preferiti dell'utente.
   * L'autenticazione è gestita dall'interceptor.
   */
  saveVideo(id: string): Observable<unknown> {
    // --- CORREZIONE: Rimosso { withCredentials: true } ---
    return this.http.post(`${this.apiUrl}/saveVideo/`, { id });
  }

  /**
   * Rimuove un video dai preferiti dell'utente.
   * L'autenticazione è gestita dall'interceptor.
   */
  removeVideo(id: string): Observable<unknown> {
    // --- CORREZIONE: Rimosso { withCredentials: true } ---
    return this.http.post(`${this.apiUrl}/deleteSavedVideo/`, { id });
  }

  /**
   * --- NOTA IMPORTANTE SU QUESTO METODO ---
   * Salva il progresso del video usando `navigator.sendBeacon`.
   * A differenza di `HttpClient`, `sendBeacon` non permette di aggiungere header custom
   * come `Authorization` in modo semplice.
   *
   * Questo metodo funzionerà solo se il tuo backend è configurato per gestire
   * l'autenticazione per l'endpoint `/save_progress/` in un modo alternativo
   * (ad esempio, accettando il token nel corpo della richiesta o usando un sistema
   * di sessione/cookie solo per questa chiamata).
   *
   * Per ora, il codice frontend rimane invariato, ma sii consapevole di questa limitazione.
   */
  saveVideoProgressOnUnload(videoId: string, positionSeconds: number): void {
    // 1. Recupera il token
    // Assicurati che la chiave sia quella giusta (es. 'auth-token', 'token', ecc.)
    const token =
      localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

    if (typeof navigator === 'undefined' || !navigator.sendBeacon) {
      return;
    }

    const url = `${this.apiUrl}/save_progress/`;

    // 2. Metti il token DENTRO i dati, non nell'header
    const data = {
      video_id: videoId,
      position_seconds: positionSeconds,
      auth_token: token, // <--- Campo speciale per il backend
    };

    // 3. Usa Blob con type application/json
    // sendBeacon fa una POST semplice, niente Preflight, parte subito.
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const success = navigator.sendBeacon(url, blob);

    // Opzionale: logga se il browser ha accettato di metterlo in coda
    // console.log('Beacon queued:', success);
  }
}
