import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoginService } from './service/login.service';
import { environment } from '../enviroments/enviroment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const loginService = inject(LoginService);
  const token = loginService.getToken();
  const apiUrl = environment.apiUrl; // Assicurati che punti al backend

  // Se abbiamo un token e la richiesta va al nostro backend
  if (token && req.url.startsWith(apiUrl)) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Token ${token}`,
      },
    });
    return next(authReq);
  }

  return next(req);
};
