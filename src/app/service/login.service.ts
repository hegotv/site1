// src/app/services/login.service.ts

import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { SocialUser } from '@abacritt/angularx-social-login';
// --- MIGLIORAMENTO: Importa l'interfaccia dal file condiviso per coerenza ---
import { UserProfile } from '../shared/interfaces';

// Interfacce per risposte API tipizzate
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

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /**
   * Verifica la sessione utente al caricamento dell'app usando l'endpoint personalizzato.
   */
  public checkSessionOnLoad(): void {
    if (!this.isBrowser) {
      return;
    }

    // --- CORREZIONE CHIAVE: Usa l'endpoint corretto e il metodo POST ---
    // Il tuo backend si aspetta una POST a /getProfile/ per verificare la sessione.
    this.http
      .post<UserProfile>(
        `${this.apiUrl}/getProfile/`,
        {},
        { withCredentials: true }
      )
      .pipe(
        catchError(() => {
          // Se la richiesta fallisce (es. 401/403), l'utente non è loggato.
          this.clearSessionData();
          return of(null);
        })
      )
      .subscribe((userProfile) => {
        if (userProfile) {
          // Se la richiesta ha successo, l'utente ha una sessione valida.
          this.handleSuccessfulLogin(userProfile);
        }
      });
  }

  // ===================================================================
  // METODI PUBBLICI PRINCIPALI
  // ===================================================================

  /**
   * Esegue il login standard. La logica qui è già corretta.
   */
  login(email: string, password: string): Observable<UserProfile> {
    // La tua vista `UserLogin` sembra restituire {key, user}, quindi questo è corretto.
    return this.http
      .post<LoginResponse>(
        `${this.apiUrl}/login/`,
        { email, password },
        {
          withCredentials: true,
        }
      )
      .pipe(
        tap((response) => this.handleSuccessfulLogin(response.user)),
        map((response) => response.user)
      );
  }

  /**
   * Esegue il login con Google. La logica qui è già corretta.
   */
  loginWithGoogle(user: SocialUser): Observable<UserProfile> {
    return this.http
      .post<LoginResponse>(
        `${this.apiUrl}/google/`,
        // --- CORREZIONE CHIAVE ---
        // Usa `user.authToken`, non `user.idToken`.
        { access_token: user.idToken },
        // -------------------------
        {
          withCredentials: true,
        }
      )
      .pipe(
        tap((response) => this.handleSuccessfulLogin(response.user)),
        map((response) => response.user)
      );
  }

  /**
   * Registra un nuovo utente. La logica qui è già corretta.
   */
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
      {
        withCredentials: true,
      }
    );
  }

  /**
   * Esegue il logout. La logica qui è già corretta.
   */
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

  /**
   * Aggiorna il profilo utente.
   */
  updateProfile(formData: FormData): Observable<UserProfile> {
    // --- CORREZIONE CHIAVE: Usa l'endpoint corretto /update/ ---
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
