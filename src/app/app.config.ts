// in src/app/app.config.ts
import { ApplicationConfig, APP_INITIALIZER } from '@angular/core'; // Importa APP_INITIALIZER
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  SocialAuthServiceConfig,
  GoogleLoginProvider,
} from '@abacritt/angularx-social-login';

// --- I NOSTRI IMPORT ---
import { csrfInterceptor } from './csrf.interceptor';
import { CsrfService } from './service/csrf.service'; // Importa il nuovo servizio

/**
 * Funzione factory che verrà eseguita da APP_INITIALIZER.
 * Inietta il CsrfService e chiama il metodo per ottenere il cookie.
 */
export function initializeCsrfFactory(
  csrfService: CsrfService
): () => Promise<any> {
  return () => csrfService.ensureCsrfCookie();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withInterceptors([csrfInterceptor])), // L'interceptor rimane fondamentale
    provideAnimationsAsync(),

    // --- BLOCCO DI INIZIALIZZAZIONE CSRF ---
    // Questo blocco garantisce che il cookie CSRF esista prima che l'utente possa interagire.
    {
      provide: APP_INITIALIZER,
      useFactory: initializeCsrfFactory,
      deps: [CsrfService], // Specifica le dipendenze della factory
      multi: true,
    },
    // --- FINE BLOCCO ---

    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(
              '639912585633-h9dd9atqmhqg6ai0sucfii51i33cep92.apps.googleusercontent.com',
              { scopes: 'email profile' }
            ),
          },
        ],
        onError: (err) => {
          console.error(err);
        },
      } as SocialAuthServiceConfig,
    },
  ],
};
