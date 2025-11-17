// in src/app/csrf.interceptor.ts
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
} from '@angular/common/http';

export const csrfInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  // Non fare più nulla. Inoltra semplicemente la richiesta.
  console.log('CSRF Interceptor (versione pulita) - Inoltro richiesta.');
  return next(req);
};
