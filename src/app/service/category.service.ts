// src/app/services/category.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';
import { VideoService } from './video.service';
import {
  Category,
  ApiDataResponse,
  Macro,
  SavedCategory,
  HomeApiCategory,
} from '../shared/interfaces';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly apiUrl = 'https://hegobck-production.up.railway.app/video';
  private allCategories$: Observable<Category[]> | null = null;

  constructor(private http: HttpClient, private videoService: VideoService) {}

  // ===================================================================
  // GESTIONE CATEGORIE PREFERITE
  // ===================================================================

  getFavoriteCategories(): Observable<SavedCategory[]> {
    return this.http
      .get<{ list: SavedCategory[] }>(`${this.apiUrl}/getSavedCategories/`, {
        withCredentials: true,
      })
      .pipe(
        map((res) => res.list || []),
        catchError(() => of([]))
      );
  }

  saveFavoriteCategory(slug: string): Observable<unknown> {
    return this.http.post(
      `${this.apiUrl}/saveCategory/`,
      { slug },
      {
        withCredentials: true,
      }
    );
  }

  removeFavoriteCategory(slug: string): Observable<unknown> {
    return this.http.post(
      `${this.apiUrl}/deleteSavedCategory/`,
      { slug },
      {
        withCredentials: true,
      }
    );
  }

  // ===================================================================
  // METODI PUBBLICI DI LETTURA
  // ===================================================================

  getMacros(): Observable<Macro[]> {
    return this.http
      .get<{ data: Macro[] }>(`${this.apiUrl}/getMacros/`)
      .pipe(map((res) => res.data || []));
  }

  /**
   * --- VERSIONE COMPLETAMENTE CORRETTA ---
   * Recupera tutte le categorie, usando una cache per performance ottimali.
   */
  getAllCategories(): Observable<Category[]> {
    if (!this.allCategories$) {
      this.allCategories$ = this.videoService.getHomeData().pipe(
        map((apiResponse: ApiDataResponse) => {
          const categoriesByMacro = apiResponse.categories_by_macro;
          const flattenedCategories: Category[] = [];

          if (!categoriesByMacro) return [];

          // Itera sulle chiavi delle macro (es. "In Evidenza")
          for (const macroKey in categoriesByMacro) {
            const macroData = categoriesByMacro[macroKey];
            // Accedi all'array 'categories' dentro l'oggetto della macro
            if (macroData?.categories) {
              // Ora 'categoryData' è correttamente tipizzato come HomeApiCategory
              for (const categoryData of macroData.categories) {
                if (categoryData.videos?.length > 0) {
                  flattenedCategories.push({
                    // Mappa i campi da HomeApiCategory a Category
                    id: categoryData.id,
                    title: categoryData.title,
                    slug: categoryData.slug,
                    CatimageOrizz: this.processImageUrl(
                      categoryData.CatimageOrizz
                    ),
                    CatimageVert: this.processImageUrl(
                      categoryData.CatimageVert
                    ),
                    description: categoryData.desc, // Mappa 'desc' a 'description'
                    videos: categoryData.videos,
                    macro: macroKey,
                  });
                }
              }
            }
          }
          return flattenedCategories;
        }),
        catchError((error) => {
          console.error('Errore durante il recupero delle categorie:', error);
          this.allCategories$ = null;
          return of([]);
        }),
        shareReplay(1)
      );
    }
    return this.allCategories$;
  }

  getCategoryBySlug(slug: string): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/getCategory/${slug}/`);
  }

  searchCategories(query: string): Observable<Category[]> {
    if (!query.trim()) {
      return of([]);
    }
    return this.getAllCategories().pipe(
      map((categories) =>
        categories.filter((cat) =>
          cat.title.toLowerCase().includes(query.toLowerCase())
        )
      )
    );
  }

  private processImageUrl(relativePath: string | null): string {
    const baseUrl = 'https://hegobck-production.up.railway.app';
    return relativePath ? `${baseUrl}${relativePath}` : '';
  }
}
