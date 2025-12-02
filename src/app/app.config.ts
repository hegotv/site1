// in src/app/app.config.ts
import { ApplicationConfig, APP_INITIALIZER, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  SocialAuthServiceConfig,
  GoogleLoginProvider,
} from '@abacritt/angularx-social-login';

import { csrfInterceptor } from './csrf.interceptor';
import { CsrfService } from './service/csrf.service';
import { authInterceptor } from './auth.interceptor';

/**
 * --- VERSIONE FINALE E CORRETTA ---
 * Questa factory si assicura che il semaforo del CsrfService venga attivato
 * solo quando l'applicazione è in esecuzione nel browser.
 */
export function initializeCsrfFactory(
  csrfService: CsrfService,
  platformId: object
): () => Promise<any> {
  if (isPlatformBrowser(platformId)) {
    // --- MODIFICA CHIAVE: Chiama il nuovo metodo init() ---
    // Questo metodo non solo fa la chiamata, ma gestisce anche lo stato 'isReady'.
    return () => csrfService.init();
  }

  // Sul server, la funzione non fa nulla e si risolve subito.
  // In questo modo, il semaforo 'isReady' non diventerà mai 'true' sul server,
  // impedendo qualsiasi chiamata API durante la build.
  return () => Promise.resolve();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(
      withInterceptors([authInterceptor, csrfInterceptor]),
      withFetch()
    ),
    provideAnimationsAsync(),

    {
      provide: APP_INITIALIZER,
      useFactory: initializeCsrfFactory,
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
