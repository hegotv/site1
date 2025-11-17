// in src/app/services/login.service.ts

import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { SocialUser } from '@abacritt/angularx-social-login';
import { UserProfile } from '../shared/interfaces';

// --- MODIFICA: L'interfaccia di Login ora include `key` che è il nostro token ---
interface LoginResponse {
  key: string; // Questo è il token di autenticazione
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
  // --- NUOVO: Chiave per salvare il token nel localStorage ---
  private readonly AUTH_TOKEN_KEY = 'authToken';

  public readonly isLoggedIn$ = new BehaviorSubject<boolean>(false);
  public readonly currentUser$ = new BehaviorSubject<UserProfile | null>(null);

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    // --- MODIFICA CHIAVE: All'avvio del servizio, controlliamo se esiste un token salvato ---
    this.loadStateFromStorage();
  }

  /**
   * --- NUOVO: Metodo pubblico per recuperare il token salvato. ---
   * Sarà utilizzato dall'interceptor per aggiungerlo alle richieste.
   */
  public getToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }
    return localStorage.getItem(this.AUTH_TOKEN_KEY);
  }

  // ===================================================================
  // METODI PUBBLICI PRINCIPALI (MODIFICATI PER TOKEN AUTH)
  // ===================================================================

  /**
   * --- MODIFICATO: Esegue il login e salva il token ricevuto. ---
   * Rimosso `withCredentials: true` perché l'autenticazione avverrà tramite l'header `Authorization`.
   */
  login(email: string, password: string): Observable<UserProfile> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login/`, {
        login_identifier: email,
        password: password,
      })
      .pipe(
        tap((response) =>
          this.handleSuccessfulLogin(response.user, response.key)
        ),
        map((response) => response.user)
      );
  }

  /**
   * --- MODIFICATO: Esegue il login con Google e salva il token. ---
   */
  loginWithGoogle(user: SocialUser): Observable<UserProfile> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/google/`, {
        access_token: user.idToken,
      })
      .pipe(
        tap((response) =>
          this.handleSuccessfulLogin(response.user, response.key)
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
    // La registrazione non richiede autenticazione, quindi la chiamata rimane invariata.
    return this.http.post<SignUpResponse>(`${this.apiUrl}/register/`, {
      email,
      password,
      username,
      first_name: name ?? '',
      last_name: surname ?? '',
    });
  }

  /**
   * --- MODIFICATO: Esegue il logout sul backend e pulisce i dati locali. ---
   */
  logout(): Observable<any> {
    // L'interceptor aggiungerà il token a questa chiamata per invalidarlo sul backend.
    return this.http.post(`${this.apiUrl}/logout/`, {}).pipe(
      tap(() => this.clearSessionData()),
      catchError(() => {
        // Se il backend fallisce, eseguiamo comunque il logout locale.
        this.clearSessionData();
        return of({ message: 'Logged out locally after API error.' });
      })
    );
  }

  updateProfile(formData: FormData): Observable<UserProfile> {
    // L'autenticazione sarà gestita dall'interceptor.
    return this.http
      .put<UserProfile>(`${this.apiUrl}/update/`, formData)
      .pipe(tap((updatedProfile) => this.updateAuthState(updatedProfile)));
  }

  // ===================================================================
  // GESTIONE DELLO STATO INTERNO (MODIFICATO)
  // ===================================================================

  /**
   * --- MODIFICATO: Salva il token nel localStorage e aggiorna lo stato. ---
   */
  private handleSuccessfulLogin(profile: UserProfile, token: string): void {
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

  /**
   * --- MODIFICATO: Rimuove il token e i dati utente da tutti gli storage. ---
   */
  private clearSessionData(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.AUTH_TOKEN_KEY);
      sessionStorage.removeItem('userProfile');
    }
    this.currentUser$.next(null);
    this.isLoggedIn$.next(false);
  }

  /**
   * --- NUOVO: Carica lo stato dai dati salvati nel browser. ---
   * Mantiene l'utente loggato dopo un refresh della pagina.
   */
  private loadStateFromStorage(): void {
    if (!this.isBrowser) return;

    const token = this.getToken();
    const userProfileRaw = sessionStorage.getItem('userProfile');

    if (token && userProfileRaw) {
      try {
        const userProfile = JSON.parse(userProfileRaw);
        // Se abbiamo sia il token sia il profilo, consideriamo l'utente loggato.
        this.handleSuccessfulLogin(userProfile, token);
      } catch (e) {
        // In caso di dati corrotti, puliamo tutto.
        this.clearSessionData();
      }
    }
  }
}
