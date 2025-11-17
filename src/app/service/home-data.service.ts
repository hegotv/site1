// in src/app/services/home-data.service.ts

import { Injectable } from '@angular/core';
import { Observable, forkJoin, of, BehaviorSubject } from 'rxjs'; // <-- Aggiungi BehaviorSubject
import { map, catchError, tap } from 'rxjs/operators'; // <-- Aggiungi tap
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
  // 1. Sostituiamo l'Observable con un BehaviorSubject per gestire lo stato
  private homePageDataSubject = new BehaviorSubject<HomePageData>({
    homeData: null,
    macros: null,
  });
  public homePageData$ = this.homePageDataSubject.asObservable();

  // 2. Il costruttore ora è pulito, fa solo dependency injection
  constructor(
    private videoService: VideoService,
    private categoryService: CategoryService
  ) {}

  // 3. Creiamo un metodo pubblico per avviare il caricamento dei dati
  public loadInitialData(): void {
    // Eseguiamo la chiamata solo una volta se i dati sono già stati caricati
    if (this.homePageDataSubject.getValue().homeData) {
      return;
    }

    this.fetchAndCombineData().subscribe((data) => {
      this.homePageDataSubject.next(data);
    });
  }

  private fetchAndCombineData(): Observable<HomePageData> {
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

  // 4. I metodi getter ora leggono dal BehaviorSubject
  getHomeData(): Observable<ApiDataResponse | null> {
    return this.homePageData$.pipe(map((data) => data.homeData));
  }

  getMacros(): Observable<Macro[] | null> {
    return this.homePageData$.pipe(map((data) => data.macros));
  }
}
