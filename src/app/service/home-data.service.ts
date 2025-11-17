// in src/app/services/home-data.service.ts

import { Injectable } from '@angular/core';
import { Observable, forkJoin, of, BehaviorSubject } from 'rxjs';
// --- PASSO 1: Importa gli operatori RxJS necessari e il CsrfService ---
import { map, catchError, filter, switchMap, take } from 'rxjs/operators';
import { CsrfService } from './csrf.service';

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

  constructor(
    private videoService: VideoService,
    private categoryService: CategoryService,
    // --- PASSO 2: Inietta il CsrfService ---
    private csrfService: CsrfService
  ) {}

  public loadInitialData(): void {
    if (this.homePageDataSubject.getValue().homeData) {
      return;
    }

    // --- PASSO 3: Implementa il pattern "semaforo" ---
    // La logica ora attende che CsrfService sia pronto prima di procedere.
    this.csrfService.isReady$
      .pipe(
        filter((ready) => ready), // Prosegui solo quando 'isReady' è true
        take(1), // Esegui questa logica solo una volta
        switchMap(() => this.fetchAndCombineData()) // Quando è pronto, esegui la vera chiamata
      )
      .subscribe((data) => {
        this.homePageDataSubject.next(data);
      });
  }

  private fetchAndCombineData(): Observable<HomePageData> {
    // Questa logica interna per combinare le chiamate è già corretta e non cambia.
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
