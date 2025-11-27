// in src/app/csrf.interceptor.ts
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { CsrfService } from './service/csrf.service'; // <-- Importa il servizio
import { environment } from '../enviroments/enviroment'; // <-- Importa l'environment

export const csrfInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const csrfService = inject(CsrfService);
  const csrfToken = csrfService.getToken();
  const apiUrl = environment.apiUrl; // Recupera l'URL base dall'environment

  // --- MODIFICA CHIAVE ---
  // Aggiungi l'header se abbiamo un token E se la richiesta è diretta alla nostra API.
  // Abbiamo rimosso il controllo sul metodo HTTP (GET, POST, etc.).
  if (csrfToken && req.url.startsWith(apiUrl)) {
    const clonedReq = req.clone({
      setHeaders: {
        'X-CSRFToken': csrfToken,
      },
    });
    return next(clonedReq);
  }

  return next(req);
};
