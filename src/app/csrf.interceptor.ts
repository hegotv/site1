// in src/app/csrf.interceptor.ts
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
} from '@angular/common/http';
import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

function getCookie(name: string): string | null {
  if (!isPlatformBrowser(inject(PLATFORM_ID)) || !document.cookie) {
    return null;
  }
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.substring(0, name.length + 1) === name + '=') {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  return null;
}

export const csrfInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const platformId = inject(PLATFORM_ID);

  if (isPlatformBrowser(platformId)) {
    const csrfToken = getCookie('csrftoken');
    if (
      csrfToken &&
      !['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(req.method)
    ) {
      const clonedReq = req.clone({
        setHeaders: {
          'X-CSRFToken': csrfToken,
        },
      });
      return next(clonedReq);
    }
  }
  return next(req);
};
