// in src/app/auth.interceptor.ts
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { LoginService } from './service/login.service';
import { environment } from '../enviroments/enviroment';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const loginService = inject(LoginService);
  const authToken = loginService.getToken();
  const apiUrl = environment.apiUrl;

  // Aggiungi l'header solo se abbiamo un token e la richiesta è per la nostra API
  if (authToken && req.url.startsWith(apiUrl)) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Token ${authToken}`,
      },
    });
    return next(clonedReq);
  }

  return next(req);
};
