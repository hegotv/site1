// src/app/services/video.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Video, ApiDataResponse } from '../shared/interfaces';

// --- MIGLIORAMENTO: Interfacce per risposte API specifiche ---

/** Interfaccia per la risposta completa di un singolo video. */
export interface DetailedVideo extends Video {
  isSaved: boolean | null; // Booleano è più pulito di un numero
  last_position_seconds?: number;
  is_completed?: boolean;
}

/** Interfaccia generica per le risposte API che contengono un payload in un campo 'data'. */
interface ApiResponse<T> {
  response: string;
  data: T;
}

/** Interfaccia per risposte che contengono un payload in un campo 'list'. */
interface ApiListResponse<T> {
  response: string;
  list: T[];
}

@Injectable({
  providedIn: 'root',
})
export class VideoService {
  // --- MIGLIORAMENTO: URL base centralizzato e readonly ---
  private readonly apiUrl = 'https://hegobck-production.up.railway.app/video';

  // --- MIGLIORAMENTO: Rimosso LoginService, non più necessario ---
  constructor(private http: HttpClient) {}

  // ===================================================================
  // METODI DI LETTURA DATI
  // ===================================================================

  /**
   * Recupera i dati aggregati per la home page.
   */
  getHomeData(): Observable<ApiDataResponse> {
    // Questa chiamata è pubblica e non necessita di credenziali.
    return this.http
      .get<ApiResponse<ApiDataResponse>>(`${this.apiUrl}/getVideos/`)
      .pipe(map((response) => response.data));
  }

  /**
   * Recupera i dettagli di un singolo video, includendo lo stato dell'utente (salvato, progresso).
   */
  getVideo(id: string): Observable<DetailedVideo> {
    return this.http
      .post<ApiResponse<DetailedVideo>>(
        `${this.apiUrl}/getVideo/`,
        { id },
        {
          // --- CORREZIONE: Usa withCredentials per inviare il cookie di sessione ---
          withCredentials: true,
        }
      )
      .pipe(map((response) => response.data));
  }

  /**
   * Recupera la lista dei video da "Continua a guardare" per l'utente loggato.
   */
  getContinueWatchingVideos(): Observable<Video[]> {
    return this.http
      .get<ApiListResponse<Video>>(`${this.apiUrl}/continue_watching/`, {
        // --- CORREZIONE: Autenticazione tramite cookie ---
        withCredentials: true,
      })
      .pipe(
        map((response) => response.list || []),
        catchError(() => of([])) // In caso di errore (es. non loggato), ritorna un array vuoto.
      );
  }

  /**
   * Recupera la lista dei video preferiti dell'utente loggato.
   */
  getFavoriteVideos(): Observable<Video[]> {
    return this.http
      .get<ApiListResponse<Video>>(`${this.apiUrl}/getSavedVideos/`, {
        // --- CORREZIONE: Autenticazione tramite cookie ---
        withCredentials: true,
      })
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
   * Anche se pubblica, necessita di `withCredentials` per la protezione CSRF.
   */
  addView(id: string): Observable<unknown> {
    return this.http.post(
      `${this.apiUrl}/setVisual/`,
      { id },
      {
        withCredentials: true,
      }
    );
  }

  /**
   * Salva un video nei preferiti dell'utente.
   */
  saveVideo(id: string): Observable<unknown> {
    return this.http.post(
      `${this.apiUrl}/saveVideo/`,
      { id },
      {
        withCredentials: true,
      }
    );
  }

  /**
   * Rimuove un video dai preferiti dell'utente.
   */
  removeVideo(id: string): Observable<unknown> {
    return this.http.post(
      `${this.apiUrl}/deleteSavedVideo/`,
      { id },
      {
        withCredentials: true,
      }
    );
  }

  /**
   * --- MIGLIORAMENTO & CORREZIONE: Salva il progresso del video usando navigator.sendBeacon. ---
   * Questo metodo è progettato per essere chiamato quando la pagina si chiude.
   * Non invia più il token manualmente (rischio di sicurezza).
   * Il browser invierà automaticamente il cookie di sessione.
   *
   * NOTA: Il tuo backend deve essere aggiornato per leggere l'utente da `request.user`
   * (derivato dalla sessione) invece che da un token nel corpo della richiesta.
   */
  saveVideoProgressOnUnload(videoId: string, positionSeconds: number): void {
    // Controlla se l'API sendBeacon è disponibile nel browser.
    if (typeof navigator === 'undefined' || !navigator.sendBeacon) {
      return;
    }

    const url = `${this.apiUrl}/save_progress/`;
    const data = {
      video_id: videoId,
      position_seconds: positionSeconds,
      // Il token non viene più inviato nel corpo della richiesta!
    };

    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    navigator.sendBeacon(url, blob);
  }
}
