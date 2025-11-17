import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from './service/login.service';

/**
 * Guardia funzionale che controlla se l'utente è autenticato.
 * Se non lo è, lo reindirizza alla pagina di login.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const loginService = inject(LoginService);
  const router = inject(Router);

  // Controlliamo il valore corrente dello stato di login
  if (loginService.isLoggedIn$.value) {
    return true; // L'utente può procedere
  }

  // L'utente non è loggato, reindirizza alla pagina di login
  return router.createUrlTree(['/login']);
};
