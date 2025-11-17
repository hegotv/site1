import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class testGuard implements CanActivate {
  // ===============================================================
  // ==========>    CONTROLLO ATTIVAZIONE E PASSWORD    <==========
  //
  // Cambia in 'false' per disattivare la protezione e rendere il sito pubblico
  private static readonly PROTECTION_ENABLED = true;

  // La password per accedere al sito in modalità test
  public static readonly PASSWORD = 'HegoWork';
  //
  // ===============================================================

  constructor(private router: Router) {}

  canActivate(): boolean {
    // 1. Se la protezione è disattivata, permette l'accesso a tutti
    if (!testGuard.PROTECTION_ENABLED) {
      return true;
    }

    // 2. Controlla se l'utente si è già autenticato in questa sessione
    const isAuthenticated =
      sessionStorage.getItem('is-authenticated') === 'true';

    if (isAuthenticated) {
      return true; // Accesso consentito
    }

    // 3. Se la protezione è attiva e l'utente non è autenticato, lo blocca
    this.router.navigate(['/lavori-in-corso']);
    return false; // Accesso bloccato
  }
}
