import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class testGuard implements CanActivate {
  private static readonly PROTECTION_ENABLED = true;
  public static readonly PASSWORD = 'HegoWork';

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object // <--- 1. Inietta l'ID della piattaforma
  ) {}

  canActivate(): boolean {
    // 1. Se la protezione è disattivata, permette l'accesso
    if (!testGuard.PROTECTION_ENABLED) {
      return true;
    }

    // 2. Controlla se siamo nel Browser prima di toccare sessionStorage
    if (isPlatformBrowser(this.platformId)) {
      const isAuthenticated =
        sessionStorage.getItem('is-authenticated') === 'true';

      if (isAuthenticated) {
        return true; // Accesso consentito
      }
    }

    // 3. Se siamo sul server (SSR) o se non autenticati nel browser, blocca
    // Nota: Il router.navigate potrebbe non funzionare lato server come ti aspetti,
    // ma almeno non crasherà l'applicazione.
    this.router.navigate(['/lavori-in-corso']);
    return false; // Accesso bloccato
  }
}
