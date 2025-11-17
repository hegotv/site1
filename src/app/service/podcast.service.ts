// src/app/service/podcast.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Rappresenta l'oggetto 'season' annidato nell'episodio.
 */
export interface SimplePodcastSeason {
  id: number;
  title: string;
  slug: string;
}

/**
 * Rappresenta un singolo episodio.
 * Corrisponde a EpisodeSerializer in Django.
 */
export interface PodcastEpisode {
  id: number;
  season: number | SimplePodcastSeason | null;
  title: string;
  speaker: string;
  description: string | null;
  duration: string;
  pub_date: string; // ISO string
  artwork_image: string; // URL assoluto dell'immagine
  audio_stream_url: string; // URL dell'endpoint di streaming
}

/**
 * Rappresenta una stagione, che contiene una lista di episodi completi.
 * Corrisponde a SeasonSerializer in Django.
 */
export interface PodcastSeason {
  id: number;
  title: string;
  slug: string;
  artwork_image: string;
  episodes: PodcastEpisode[];
}

/**
 * Rappresenta una sezione (es. 'Ultime Uscite'), che contiene una lista di stagioni.
 * Corrisponde a SectionSerializer in Django.
 */
export interface PodcastSection {
  id: number;
  title: string;
  slug: string;
  seasons: PodcastSeason[];
}

@Injectable({
  providedIn: 'root',
})
export class PodcastService {
  // <<<<<<<<<<<<<<<<<<<<<<< CORREZIONE 1: URL base aggiornato >>>>>>>>>>>>>>>>>>>>
  // Allineato con l'inclusione delle URL nel progetto principale di Django
  private baseUrl = 'https://hegobck-production.up.railway.app/podcast/';

  constructor(private http: HttpClient) {}

  /**
   * Recupera tutte le sezioni, ognuna con le sue stagioni ed episodi.
   * Chiama l'endpoint principale della pagina podcast.
   */
  getPodcastSections(): Observable<PodcastSection[]> {
    // Il path è vuoto perché il baseUrl già punta a /api/podcasts/
    // La chiamata a "" corrisponde a `https://.../api/podcasts/`
    return this.http.get<PodcastSection[]>(this.baseUrl + 'sections/');
  }

  /**
   * Recupera i dettagli di una singola stagione, inclusi tutti i suoi episodi.
   * Utile per la pagina "Vedi tutto".
   * @param seasonSlug Lo slug della stagione.
   */
  getSeasonDetails(seasonSlug: string): Observable<PodcastSeason> {
    const url = `${this.baseUrl}seasons/${seasonSlug}/`;
    return this.http.get<PodcastSeason>(url);
  }

  /**
   * Recupera i dettagli di un singolo episodio, che includerà il riferimento alla sua stagione.
   * @param id L'ID numerico dell'episodio.
   */
  getEpisodeDetails(id: string | number): Observable<PodcastEpisode> {
    const url = `${this.baseUrl}episodes/${id}/`;
    return this.http.get<PodcastEpisode>(url);
  }

  // Non abbiamo più bisogno di un metodo che chiami l'endpoint di streaming,
  // perché l'URL viene già fornito dall'API all'interno dell'oggetto PodcastEpisode.
  // Il tag <audio> userà direttamente quel link.
}
