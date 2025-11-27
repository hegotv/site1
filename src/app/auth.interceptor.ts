import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoginService } from './service/login.service';
import { environment } from '../enviroments/enviroment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const loginService = inject(LoginService);
  const token = loginService.getToken();
  // Aggiungiamo un log per vedere cosa legge l'interceptor

  if (token && token !== 'undefined' && token !== 'null') {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Token ${token}`,
      },
    });
    return next(authReq);
  }

  return next(req);
};
