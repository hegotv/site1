import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoginService } from './service/login.service';
import { environment } from '../enviroments/enviroment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const loginService = inject(LoginService);
  const token = loginService.getToken(); // Questo restituisce null o "undefined" stringa

  // CONTROLLO RIGOROSO: Aggiungi l'header SOLO se il token esiste ed è valido
  if (token && token !== 'undefined' && token !== 'null') {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Token ${token}`,
      },
    });
    return next(authReq);
  }

  // Se non c'è token, invia la richiesta pulita (senza header Authorization)
  return next(req);
};
