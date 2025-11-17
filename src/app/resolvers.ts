import { inject } from '@angular/core'; // <<<<==== QUESTO È L'UNICO IMPORT CORRETTO PER 'inject'
import { ResolveFn, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, take, tap } from 'rxjs/operators';

import { CategoryService } from './service/category.service';
import { VideoService } from './service/video.service';
import { Category } from './shared/interfaces';

/**
 * Resolver che pre-carica i dati di una categoria usando il suo slug.
 * Se la categoria non viene trovata, reindirizza a una pagina non trovata.
 */
export const seasonResolver: ResolveFn<Category | null | undefined> = (
  route,
  state
) => {
  const categoryService = inject(CategoryService);
  const router = inject(Router);
  // NOTA: Assicurati che il nome del parametro nella tua configurazione di routing sia corretto.
  // Se è solo 'slug', cambia .get('categoryTitleSlug') in .get('slug').
  const slug = route.paramMap.get('categoryTitleSlug');

  if (!slug) {
    router.navigate(['/404']); // O alla home
    return of(null);
  }

  // Chiama il metodo corretto che ottiene i dati completi dal backend.
  return categoryService.getCategoryBySlug(slug).pipe(
    take(1),
    tap((category) => {
      if (!category) {
        router.navigate(['/404']);
      }
    }),
    catchError((error) => {
      console.error('Errore nel resolver della stagione:', error);
      router.navigate(['/404']);
      return of(null);
    })
  );
};

/**
 * Resolver che pre-carica i dati di un video usando il suo ID dai query params.
 */
export const videoResolver: ResolveFn<any | null> = (route, state) => {
  const videoService = inject(VideoService);
  const router = inject(Router);
  const videoId = route.queryParamMap.get('id');

  if (!videoId) {
    router.navigate(['/404']);
    return of(null);
  }

  return videoService.getVideo(videoId).pipe(
    take(1),
    catchError(() => {
      router.navigate(['/404']);
      return of(null);
    })
  );
};
