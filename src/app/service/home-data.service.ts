// src/app/services/home-data.service.ts

import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, shareReplay, catchError } from 'rxjs/operators';
import { VideoService } from './video.service';
import { CategoryService } from './category.service';
import { ApiDataResponse, Macro } from '../shared/interfaces'; // Assicurati che Macro sia esportata da un file condiviso

/**
 * Interfaccia che definisce la forma dei dati combinati per la pagina principale.
 */
export interface HomePageData {
  homeData: ApiDataResponse | null;
  macros: Macro[] | null;
}

@Injectable({
  providedIn: 'root',
})
export class HomeDataService {
  private readonly homePageData$: Observable<HomePageData>;

  constructor(
    private videoService: VideoService,
    private categoryService: CategoryService
  ) {
    this.homePageData$ = this.fetchAndCombineData().pipe(
      shareReplay({
        bufferSize: 1, // Mantiene in cache l'ultimo valore
        refCount: true, // Esegue la chiamata solo se ci sono subscriber attivi
        windowTime: 20 * 60 * 1000, // La cache scade dopo 20 minuti
      })
    );
  }

  /**
   * Esegue le chiamate parallele ai servizi e combina i loro risultati.
   */
  private fetchAndCombineData(): Observable<HomePageData> {
    return forkJoin({
      homeResponse: this.videoService.getHomeData().pipe(
        // --- MIGLIORAMENTO: Gestione dell'errore a livello di singolo stream ---
        // Se questa chiamata fallisce, forkJoin non si romperà, ma riceverà `null`.
        catchError(() => of(null))
      ),
      macrosResponse: this.categoryService.getMacros().pipe(
        // --- MIGLIORAMENTO: Il codice è più pulito ---
        // Non c'è più bisogno di trasformare i dati qui.
        // `CategoryService.getMacros()` è ora responsabile di restituire i dati nel formato corretto.
        catchError(() => of(null)) // Se fallisce, restituisce null.
      ),
    }).pipe(
      map(({ homeResponse, macrosResponse }) => {
        // La mappatura è ora più semplice e diretta.
        return {
          homeData: homeResponse,
          macros: macrosResponse,
        };
      }),
      catchError((error) => {
        // Questo catch agisce come un fallback finale se forkJoin avesse un problema imprevisto.
        console.error(
          'Errore irrecuperabile durante il caricamento dei dati per la home:',
          error
        );
        return of({ homeData: null, macros: null });
      })
    );
  }

  // --- MIGLIORAMENTO: Rimossa la funzione `processImageUrl`. ---
  // Questa logica ora appartiene a `CategoryService`, rendendo questo servizio più focalizzato.

  /**
   * Espone l'Observable contenente i dati principali della home page.
   * I componenti si iscrivono a questo per ottenere i dati in modo reattivo.
   */
  getHomeData(): Observable<ApiDataResponse | null> {
    return this.homePageData$.pipe(map((data) => data.homeData));
  }

  /**
   * Espone l'Observable contenente la lista delle macro.
   */
  getMacros(): Observable<Macro[] | null> {
    return this.homePageData$.pipe(map((data) => data.macros));
  }
}
