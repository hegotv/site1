// in src/app/app.config.ts
import { ApplicationConfig, APP_INITIALIZER, PLATFORM_ID } from '@angular/core'; // <-- Importa PLATFORM_ID
import { isPlatformBrowser } from '@angular/common'; // <-- Importa il check
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  SocialAuthServiceConfig,
  GoogleLoginProvider,
} from '@abacritt/angularx-social-login';

import { csrfInterceptor } from './csrf.interceptor';
import { CsrfService } from './service/csrf.service';

/**
 * --- CORREZIONE CHIAVE ---
 * La factory ora riceve il platformId per capire se è in un browser o sul server.
 */
export function initializeCsrfFactory(
  csrfService: CsrfService,
  platformId: object
): () => Promise<any> {
  // Esegui la chiamata per ottenere il cookie SOLO se siamo in un browser.
  if (isPlatformBrowser(platformId)) {
    return () => csrfService.ensureCsrfCookie();
  }
  // Se siamo sul server (durante la build), ritorna una funzione che non fa nulla
  // e si risolve immediatamente, per non bloccare la build.
  return () => Promise.resolve();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withInterceptors([csrfInterceptor])),
    provideAnimationsAsync(),

    {
      provide: APP_INITIALIZER,
      useFactory: initializeCsrfFactory,
      // --- CORREZIONE: Aggiungi PLATFORM_ID alle dipendenze ---
      deps: [CsrfService, PLATFORM_ID],
      multi: true,
    },
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
