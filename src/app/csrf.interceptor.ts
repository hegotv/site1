// in src/app/csrf.interceptor.ts
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
} from '@angular/common/http';

/**
 * Funzione helper per leggere un cookie specifico dal browser.
 * @param name Il nome del cookie da leggere (es. 'csrftoken').
 * @returns Il valore del cookie o null se non trovato.
 */
function getCookie(name: string): string | null {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      // Controlla se la stringa del cookie inizia con il nome che cerchiamo
      if (cookie.substring(0, name.length + 1) === name + '=') {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

export const csrfInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  // Ottieni il token CSRF dai cookie del browser
  const csrfToken = getCookie('csrftoken');

  // Applica l'header solo per le richieste che non sono GET, HEAD, OPTIONS, TRACE
  // e se il token CSRF è stato trovato.
  if (csrfToken && !['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(req.method)) {
    // Clona la richiesta per aggiungere il nuovo header, poiché le richieste sono immutabili.
    const clonedReq = req.clone({
      setHeaders: {
        'X-CSRFToken': csrfToken, // Nome dell'header che Django si aspetta di default
      },
    });
    console.log('CSRF Interceptor: Aggiunto header X-CSRFToken.');
    // Inoltra la richiesta clonata con l'header aggiunto
    return next(clonedReq);
  }

  // Per le richieste GET o se il token non è presente, inoltra la richiesta originale.
  return next(req);
};
