// in src/app/csrf.interceptor.ts
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
} from '@angular/common/http';
import { PLATFORM_ID, inject } from '@angular/core'; // <-- Importa PLATFORM_ID e inject
import { isPlatformBrowser } from '@angular/common'; // <-- Importa il check della piattaforma

/**
 * Funzione helper per leggere un cookie.
 * IMPORTANTE: Questa funzione deve essere chiamata solo dopo aver verificato
 * di essere in un ambiente browser.
 */
function getCookie(name: string): string | null {
  let cookieValue = null;
  // Non è più necessario un check qui, perché lo facciamo a monte.
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.substring(0, name.length + 1) === name + '=') {
      cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
      break;
    }
  }
  return cookieValue;
}

export const csrfInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  // 1. Inietta il PLATFORM_ID per capire in quale ambiente siamo.
  const platformId = inject(PLATFORM_ID);

  // 2. Esegui la logica CSRF solo se il codice sta girando in un browser.
  if (isPlatformBrowser(platformId)) {
    // Essendo nel browser, l'oggetto 'document' è disponibile e sicuro da usare.
    if (document.cookie) {
      const csrfToken = getCookie('csrftoken');

      // Aggiungi l'header solo alle richieste che modificano lo stato (non GET, etc.)
      if (
        csrfToken &&
        !['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(req.method)
      ) {
        const clonedReq = req.clone({
          setHeaders: {
            'X-CSRFToken': csrfToken,
          },
        });
        return next(clonedReq);
      }
    }
  }

  // 3. Se siamo sul server (durante la build/prerendering), inoltra la richiesta
  //    senza tentare di leggere i cookie.
  return next(req);
};
