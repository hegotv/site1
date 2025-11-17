// in src/app/services/login.service.ts

import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
// --- N.B: CsrfService e gli operatori extra (filter, switchMap, take) non sono più necessari ---

import { SocialUser } from '@abacritt/angularx-social-login';
import { UserProfile } from '../shared/interfaces';

// Interfacce (nessuna modifica)
interface LoginResponse {
  key: string;
  user: UserProfile;
}
interface SignUpResponse {
  key: string;
  detail?: string;
}

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private readonly apiUrl = 'https://hegobck-production.up.railway.app/auth';
  private readonly isBrowser: boolean;

  public readonly isLoggedIn$ = new BehaviorSubject<boolean>(false);
  public readonly currentUser$ = new BehaviorSubject<UserProfile | null>(null);

  // --- SEMPLIFICAZIONE: Il costruttore non ha più bisogno del CsrfService ---
  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  public checkSessionOnLoad(): void {
    if (!this.isBrowser) {
      return;
    }

    // --- SEMPLIFICAZIONE: La chiamata ora è diretta ---
    // Non c'è più bisogno di aspettare, l'APP_INITIALIZER ha già fatto il suo lavoro.
    this.http
      .post<UserProfile>(
        `${this.apiUrl}/getProfile/`,
        {},
        { withCredentials: true }
      )
      .pipe(
        catchError(() => {
          this.clearSessionData();
          return of(null);
        })
      )
      .subscribe((userProfile) => {
        if (userProfile) {
          this.handleSuccessfulLogin(userProfile);
        }
      });
  }

  // ===================================================================
  // METODI PUBBLICI PRINCIPALI (semplificati)
  // ===================================================================

  login(email: string, password: string): Observable<UserProfile> {
    return this.http
      .post<LoginResponse>(
        `${this.apiUrl}/login/`,
        { email, password },
        { withCredentials: true }
      )
      .pipe(
        tap((response) => this.handleSuccessfulLogin(response.user)),
        map((response) => response.user)
      );
  }

  loginWithGoogle(user: SocialUser): Observable<UserProfile> {
    return this.http
      .post<LoginResponse>(
        `${this.apiUrl}/google/`,
        { access_token: user.idToken },
        { withCredentials: true }
      )
      .pipe(
        tap((response) => this.handleSuccessfulLogin(response.user)),
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
    return this.http.post<SignUpResponse>(
      `${this.apiUrl}/register/`,
      {
        email,
        password,
        username,
        first_name: name ?? '',
        last_name: surname ?? '',
      },
      { withCredentials: true }
    );
  }

  logout(): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/logout/`, {}, { withCredentials: true })
      .pipe(
        tap(() => this.clearSessionData()),
        catchError(() => {
          this.clearSessionData();
          return of({ message: 'Logged out locally after API error.' });
        })
      );
  }

  updateProfile(formData: FormData): Observable<UserProfile> {
    return this.http
      .put<UserProfile>(`${this.apiUrl}/update/`, formData, {
        withCredentials: true,
      })
      .pipe(tap((updatedProfile) => this.updateAuthState(updatedProfile)));
  }
  // ===================================================================
  // GESTIONE DELLO STATO INTERNO
  // ===================================================================

  private handleSuccessfulLogin(profile: UserProfile): void {
    if (this.isBrowser) {
      // Usiamo sessionStorage per memorizzare il profilo per un rapido recupero
      // al reload della pagina, ma la vera fonte di verità è il cookie di sessione.
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
      sessionStorage.removeItem('userProfile');
    }
    this.currentUser$.next(null);
    this.isLoggedIn$.next(false);
  }
}
