// in src/app/services/home-data.service.ts

import { Injectable } from '@angular/core';
import { Observable, forkJoin, of, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
// --- N.B: CsrfService e gli operatori extra (filter, switchMap, take) non sono più necessari qui ---

import { VideoService } from './video.service';
import { CategoryService } from './category.service';
import { ApiDataResponse, Macro } from '../shared/interfaces';

export interface HomePageData {
  homeData: ApiDataResponse | null;
  macros: Macro[] | null;
}

@Injectable({
  providedIn: 'root',
})
export class HomeDataService {
  private homePageDataSubject = new BehaviorSubject<HomePageData>({
    homeData: null,
    macros: null,
  });
  public homePageData$ = this.homePageDataSubject.asObservable();

  // --- SEMPLIFICAZIONE: Il costruttore non ha più bisogno del CsrfService ---
  constructor(
    private videoService: VideoService,
    private categoryService: CategoryService
  ) {}

  public loadInitialData(): void {
    if (this.homePageDataSubject.getValue().homeData) {
      return;
    }

    // --- SEMPLIFICAZIONE: Rimuoviamo il pattern "semaforo". ---
    // La chiamata ora è diretta, perché l'APP_INITIALIZER garantisce
    // che questa funzione venga eseguita solo al momento giusto.
    this.fetchAndCombineData().subscribe((data) => {
      this.homePageDataSubject.next(data);
    });
  }

  private fetchAndCombineData(): Observable<HomePageData> {
    // Questa logica interna è corretta e non cambia.
    return forkJoin({
      homeResponse: this.videoService
        .getHomeData()
        .pipe(catchError(() => of(null))),
      macrosResponse: this.categoryService
        .getMacros()
        .pipe(catchError(() => of(null))),
    }).pipe(
      map(({ homeResponse, macrosResponse }) => {
        return {
          homeData: homeResponse,
          macros: macrosResponse,
        };
      }),
      catchError(() => of({ homeData: null, macros: null }))
    );
  }

  // I metodi getter rimangono invariati.
  getHomeData(): Observable<ApiDataResponse | null> {
    return this.homePageData$.pipe(map((data) => data.homeData));
  }

  getMacros(): Observable<Macro[] | null> {
    return this.homePageData$.pipe(map((data) => data.macros));
  }
}
