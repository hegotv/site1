// in src/app/service/csrf.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../enviroments/enviroment';

// Interfaccia per la risposta
interface CsrfTokenResponse {
  csrfToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class CsrfService {
  private csrfTokenUrl = `${environment.apiUrl}/auth/csrf/`;

  // 1. Una variabile per conservare il token in memoria.
  private token: string | null = null;

  constructor(private http: HttpClient) {}

  // 2. Il metodo init() ora cattura e salva il token dalla risposta JSON.
  public init(): Promise<any> {
    return firstValueFrom(
      this.http
        .get<CsrfTokenResponse>(this.csrfTokenUrl, { withCredentials: true })
        .pipe(
          tap((response) => {
            this.token = response.csrfToken;
          })
        )
    );
  }

  // 3. Un metodo pubblico per permettere all'interceptor di recuperare il token.
  public getToken(): string | null {
    return this.token;
  }
}
