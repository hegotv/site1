import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, HostListener } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { LoginService } from '../service/login.service';
import { UserProfile } from '../shared/interfaces';
import { filter, Subscription, switchMap, finalize, tap } from 'rxjs';
import {
  SocialAuthService,
  SocialUser,
  GoogleSigninButtonModule,
} from '@abacritt/angularx-social-login';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    GoogleSigninButtonModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit, OnDestroy {
  // --- MIGLIORAMENTO: `isMobile` è ora dinamico ---
  isMobile: boolean = window.innerWidth < 768;

  loginForm!: FormGroup;
  loginErrorMessage: string | null = null;
  registrationSuccessMessage: string | null = null;
  hidePassword = true;
  isLoading = false; // --- MIGLIORAMENTO: Aggiunto stato di caricamento ---
  private authSubscription!: Subscription;

  // --- MIGLIORAMENTO: HostListener per un responsive design corretto ---
  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.isMobile = (event.target as Window).innerWidth < 768;
  }

  constructor(
    private loginService: LoginService,
    private router: Router,
    private socialAuthService: SocialAuthService,
    private route: ActivatedRoute // Aggiunto per leggere i query params
  ) {}

  ngOnInit(): void {
    // Se l'utente è già loggato, reindirizzalo subito alla home.
    if (this.loginService.isLoggedIn$.value) {
      this.router.navigate(['/']);
      return; // Interrompi l'esecuzione di ngOnInit
    }

    // --- MIGLIORAMENTO: Controlla se l'utente arriva dalla pagina di registrazione ---
    this.route.queryParams.subscribe((params) => {
      if (params['registered'] === 'success') {
        this.registrationSuccessMessage =
          'Registrazione completata! Ora puoi effettuare il login.';
      }
    });

    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required]),
      // NOTA: Il campo 'rememberMe' è stato rimosso dal form.
      // La gestione della durata della sessione è ora responsabilità del backend.
    });

    this.authSubscription = this.socialAuthService.authState
      .pipe(
        filter((user): user is SocialUser => !!user),

        // --- AGGIUNGI QUESTO BLOCCO DI DEBUG ---
        tap((user) => {
          console.log('Oggetto User ricevuto dal social service:', user);
          // Controlla specificamente il token che ti serve!
          console.log('Valore di user.authToken:', user.authToken);
        }),
        // -----------------------------------------

        switchMap((user) => this.loginService.loginWithGoogle(user))
      )
      .subscribe({
        next: (profile: UserProfile) => {
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.handleLoginError(err);
        },
      });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true; // Avvia il caricamento
    this.loginErrorMessage = null;
    this.registrationSuccessMessage = null; // Nascondi il messaggio di successo

    const { email, password } = this.loginForm.value;

    this.loginService
      .login(email, password)
      .pipe(
        // --- MIGLIORAMENTO: `finalize` assicura che `isLoading` venga resettato ---
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (profile: UserProfile) => {
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.handleLoginError(err);
        },
      });
  }

  /**
   * --- MIGLIORAMENTO: Gestione degli errori più specifica per Django REST Framework ---
   */
  private handleLoginError(err: any): void {
    console.error('Errore durante il processo di login:', err);
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        this.loginErrorMessage =
          'Errore di rete. Controlla la tua connessione e riprova.';
      } else if (err.status === 400 || err.status === 401) {
        // DRF/dj-rest-auth usa status 400 per credenziali errate.
        // Cerca un messaggio specifico, altrimenti mostra un errore generico.
        const errorDetail = err.error?.non_field_errors;
        this.loginErrorMessage = Array.isArray(errorDetail)
          ? errorDetail[0]
          : 'Email o password non corretti. Riprova.';
      } else {
        this.loginErrorMessage = `Si è verificato un errore (${err.status}). Riprova più tardi.`;
      }
    } else {
      this.loginErrorMessage =
        'Si è verificato un errore inaspettato. Riprova.';
    }
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
