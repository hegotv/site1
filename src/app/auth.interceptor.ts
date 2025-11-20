import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoginService } from './service/login.service';
import { environment } from '../enviroments/enviroment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const loginService = inject(LoginService);
  const token = loginService.getToken();
  // Aggiungiamo un log per vedere cosa legge l'interceptor
  console.log('AUTH INTERCEPTOR -> URL:', req.url, 'TOKEN:', token);

  if (token && token !== 'undefined' && token !== 'null') {
    console.log('AUTH INTERCEPTOR -> Aggiungo Header Authorization');
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Token ${token}`,
      },
    });
    return next(authReq);
  }

  console.log(
    'AUTH INTERCEPTOR -> Token non valido o mancante, invio richiesta liscia'
  );
  return next(req);
};
