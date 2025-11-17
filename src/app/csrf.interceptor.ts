// in src/app/csrf.interceptor.ts
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { CsrfService } from './service/csrf.service'; // <-- Importa il servizio

export const csrfInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  // 1. Inietta il CsrfService invece di PLATFORM_ID.
  const csrfService = inject(CsrfService);

  // 2. Recupera il token salvato dal servizio.
  const csrfToken = csrfService.getToken();

  console.log(`[CSRF Interceptor] Esecuzione per ${req.method} ${req.url}`);
  console.log(`[CSRF Interceptor] Token recuperato dal servizio:`, csrfToken);

  // 3. La logica per aggiungere l'header rimane la stessa.
  if (csrfToken && !['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(req.method)) {
    console.log(`[CSRF Interceptor] Aggiungo l'header X-CSRFToken.`);
    const clonedReq = req.clone({
      setHeaders: {
        'X-CSRFToken': csrfToken,
      },
    });
    return next(clonedReq);
  }

  console.log(`[CSRF Interceptor] Nessun header aggiunto.`);
  return next(req);
};
