// in src/app/csrf.interceptor.ts
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
} from '@angular/common/http';
import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// Questa funzione helper rimane invariata
function getCookie(name: string): string | null {
  if (
    !isPlatformBrowser(inject(PLATFORM_ID)) ||
    typeof document === 'undefined' ||
    !document.cookie
  ) {
    return null;
  }
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.substring(0, name.length + 1) === name + '=') {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  return null;
}

// L'interceptor con i log di debug
export const csrfInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  // LOG 1: Controlliamo se l'interceptor viene eseguito
  console.log(
    `[CSRF Interceptor] Esecuzione per la richiesta: ${req.method} ${req.url}`
  );

  const platformId = inject(PLATFORM_ID);

  if (isPlatformBrowser(platformId)) {
    // LOG 2: Confermiamo di essere nel browser
    console.log('[CSRF Interceptor] Ambiente browser rilevato.');

    const csrfToken = getCookie('csrftoken');

    // LOG 3: Questo è il log più importante. Mostra il token che abbiamo trovato.
    console.log(
      `[CSRF Interceptor] Valore del cookie 'csrftoken' trovato:`,
      csrfToken
    );

    if (
      csrfToken &&
      !['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(req.method)
    ) {
      // LOG 4: Confermiamo che stiamo per aggiungere l'header
      console.log(
        `[CSRF Interceptor] La richiesta è di tipo ${req.method} e il token esiste. Aggiungo l'header X-CSRFToken.`
      );

      const clonedReq = req.clone({
        setHeaders: {
          'X-CSRFToken': csrfToken,
        },
      });
      return next(clonedReq);
    } else {
      // LOG 5: Spieghiamo perché l'header non viene aggiunto
      console.log(
        `[CSRF Interceptor] L'header non sarà aggiunto. Motivo: Richiesta GET o token non trovato.`
      );
    }
  } else {
    // LOG 6: Spieghiamo perché non facciamo nulla sul server
    console.log(
      '[CSRF Interceptor] Ambiente server rilevato. Nessuna azione intrapresa.'
    );
  }

  return next(req);
};
