import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { SocialUser } from '@abacritt/angularx-social-login';
import { UserProfile } from '../shared/interfaces';

interface LoginResponse {
  token: string;
  user: UserProfile;
  response?: string;
}

interface SignUpResponse {
  token: string;
  user: UserProfile;
  response?: string;
  detail?: string;
}

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  // Assicurati che punti al tuo backend Railway
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

  // --- LOGIN CLASSICO ---
  login(email: string, password: string): Observable<UserProfile> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login/`, {
        login_identifier: email,
        password: password,
      })
      .pipe(
        tap((response) => {
          this.handleSuccessfulLogin(response.user, response.token);
        }),
        map((response) => response.user)
      );
  }

  // --- GOOGLE LOGIN ---
  loginWithGoogle(user: SocialUser): Observable<UserProfile> {
    // Definiamo il callback url (deve coincidere con il dominio attuale o quello settato in Django)
    const origin = this.isBrowser
      ? window.location.origin
      : 'https://www.hegotv.com';

    return this.http
      .post<LoginResponse>(`${this.apiUrl}/google/`, {
        access_token: user.idToken,
        id_token: user.idToken,
        callback_url: origin,
      })
      .pipe(
        tap((response) =>
          this.handleSuccessfulLogin(response.user, response.token)
        ),
        map((response) => response.user)
      );
  }

  // --- APPLE LOGIN (NUOVO) ---
  loginWithApple(appleResponse: any): Observable<UserProfile> {
    // Apple restituisce un oggetto 'authorization' contenente id_token e code.
    const idToken = appleResponse.authorization.id_token;
    const code = appleResponse.authorization.code;

    // Per SPAs, a volte serve inviare anche l'utente (nome/cognome) se è il primo login
    // Apple lo invia SOLO la prima volta nell'oggetto 'user'.
    const userData = appleResponse.user
      ? JSON.stringify(appleResponse.user)
      : null;

    const payload: any = {
      access_token: idToken, // Usiamo idToken come access_token per soddisfare il serializer
      id_token: idToken,
      code: code, // Opzionale a seconda della config backend, ma utile inviarlo
    };

    if (userData) {
      // Se vuoi gestire nome/cognome lato backend custom
      payload.user_json = userData;
    }

    return this.http.post<LoginResponse>(`${this.apiUrl}/apple/`, payload).pipe(
      tap((response) =>
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
    return this.http
      .post<SignUpResponse>(`${this.apiUrl}/register/`, {
        email,
        password,
        username,
        first_name: name ?? '',
        last_name: surname ?? '',
      })
      .pipe(
        tap((response) => {
          if (response.token && response.user) {
            // Salviamo token e utente nel localStorage/Session
            this.handleSuccessfulLogin(response.user, response.token);
          }
        })
      );
  }

  // --- LOGOUT ---
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
      console.error('ERRORE: Token undefined o vuoto!');
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
        this.updateAuthState(userProfile);
      } catch (e) {
        this.clearSessionData();
      }
    }
  }
}
