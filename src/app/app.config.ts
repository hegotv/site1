import { ApplicationConfig } from '@angular/core';
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

// NON sono più necessari:
// import { APP_INITIALIZER } from '@angular/core';
// import { CsrfService } from './service/csrf.service';
// export function initializeCsrfFactory(...) { ... }

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withInterceptors([csrfInterceptor])),
    provideAnimationsAsync(),

    // Abbiamo rimosso il blocco per APP_INITIALIZER e CsrfService
    // perché non è più necessario. L'interceptor ora è autonomo.

    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(
              '639912585633-h9dd9atqmhqg6ai0sucfii51i33cep92.apps.googleusercontent.com',
              {
                scopes: 'email profile',
              }
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
