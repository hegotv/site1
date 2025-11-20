import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { SocialUser } from '@abacritt/angularx-social-login';
import { UserProfile } from '../shared/interfaces';

// --- CORREZIONE INTERFACCIA ---
interface LoginResponse {
  token: string; // <-- Il backend invia "token", NON "key"
  user: UserProfile; // Ora il backend invia questo oggetto
  response?: string; // "ok" o "error"
}

interface SignUpResponse {
  token: string; // Uniformiamo anche qui se necessario
  detail?: string;
}

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  // Assicurati che questo URL sia quello del tuo custom domain se l'hai configurato,
  // altrimenti usa railway, ma ricorda che i cookie non andranno (il token sì).
  private readonly apiUrl = 'https://hegobck-production.up.railway.app/auth';
  private readonly isBrowser: boolean;
  private readonly AUTH_TOKEN_KEY = 'authToken';

  public readonly isLoggedIn$ = new BehaviorSubject<boolean>(false);
  public readonly currentUser$ = new BehaviorSubject<UserProfile | null>(null);

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.loadStateFromStorage();
  }

  public getToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }
    return localStorage.getItem(this.AUTH_TOKEN_KEY);
  }

  login(email: string, password: string): Observable<UserProfile> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login/`, {
        login_identifier: email,
        password: password,
      })
      .pipe(
        tap((response) => {
          // --- CORREZIONE: Usiamo response.token ---
          console.log('Login riuscito, token ricevuto:', response.token);
          this.handleSuccessfulLogin(response.user, response.token);
        }),
        map((response) => response.user)
      );
  }

  loginWithGoogle(user: SocialUser): Observable<UserProfile> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/google/`, {
        access_token: user.idToken,
        id_token: user.idToken,
      })
      .pipe(
        tap((response) =>
          // Assicurati che anche la view GoogleLogin restituisca "token" e "user"
          // Se usi dj_rest_auth standard, di solito restituisce "key".
          // Controlla cosa restituisce la tua view GoogleLogin.
          // Se restituisce "key", qui dovrai usare `response.key || response.token`
          this.handleSuccessfulLogin(response.user, response.token)
        ),
        map((response) => response.user)
      );
  }

  signUp(
    email: string,
    username: string,
    password: string,
    name?: string,
    surname?: string
  ): Observable<SignUpResponse> {
    return this.http.post<SignUpResponse>(`${this.apiUrl}/register/`, {
      email,
      password,
      username,
      first_name: name ?? '',
      last_name: surname ?? '',
    });
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout/`, {}).pipe(
      tap(() => this.clearSessionData()),
      catchError(() => {
        this.clearSessionData();
        return of({ message: 'Logged out locally after API error.' });
      })
    );
  }

  updateProfile(formData: FormData): Observable<UserProfile> {
    return this.http
      .put<UserProfile>(`${this.apiUrl}/update/`, formData)
      .pipe(tap((updatedProfile) => this.updateAuthState(updatedProfile)));
  }

  // ===================================================================
  // PRIVATE METHODS
  // ===================================================================

  private handleSuccessfulLogin(profile: UserProfile, token: string): void {
    if (!token) {
      console.error(
        'ERRORE GRAVE: Tentativo di salvare un token undefined o vuoto!'
      );
      return;
    }

    if (this.isBrowser) {
      localStorage.setItem(this.AUTH_TOKEN_KEY, token);
      sessionStorage.setItem('userProfile', JSON.stringify(profile));
    }
    this.updateAuthState(profile);
  }

  private updateAuthState(profile: UserProfile): void {
    this.currentUser$.next(profile);
    this.isLoggedIn$.next(true);
  }

  private clearSessionData(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.AUTH_TOKEN_KEY);
      sessionStorage.removeItem('userProfile');
    }
    this.currentUser$.next(null);
    this.isLoggedIn$.next(false);
  }

  private loadStateFromStorage(): void {
    if (!this.isBrowser) return;

    const token = this.getToken();
    const userProfileRaw = sessionStorage.getItem('userProfile');

    if (token && userProfileRaw) {
      try {
        const userProfile = JSON.parse(userProfileRaw);
        // Invece di richiamare handleSuccessfulLogin che riscriverebbe lo storage,
        // aggiorniamo solo lo stato in memoria.
        this.updateAuthState(userProfile);
      } catch (e) {
        this.clearSessionData();
      }
    }
  }
}
