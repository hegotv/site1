import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LoginService } from '../service/login.service';
import { UserProfile } from '../shared/interfaces';
import { MatIconModule } from '@angular/material/icon';
import { Subscription, filter, switchMap, finalize } from 'rxjs';
import {
  SocialAuthService,
  SocialUser,
  GoogleSigninButtonModule,
} from '@abacritt/angularx-social-login';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    GoogleSigninButtonModule,
  ],
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css'],
})
export class RegistrationComponent implements OnInit, OnDestroy {
  // --- MIGLIORAMENTO: `isMobile` è ora dinamico ---
  isMobile: boolean = window.innerWidth < 768;

  registrationForm!: FormGroup;
  registrationErrorMessage: string | null = null;
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
    private socialAuthService: SocialAuthService
  ) {}

  ngOnInit(): void {
    this.registrationForm = new FormGroup({
      nome: new FormControl('', [Validators.required, Validators.minLength(2)]),
      cognome: new FormControl('', [
        Validators.required,
        Validators.minLength(2),
      ]),
      // NOTA: I seguenti campi non vengono usati nella chiamata `signUp`.
      // Valuta se rimuoverli o aggiungerli alla chiamata API.
      // dataDiNascita: new FormControl('', Validators.required),
      // sesso: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
      ]),
    });

    this.authSubscription = this.socialAuthService.authState
      .pipe(
        filter((user): user is SocialUser => !!user),
        // --- CORREZIONE: Rimosso il secondo argomento `true` ---
        switchMap((user) => this.loginService.loginWithGoogle(user))
      )
      .subscribe({
        next: (profile: UserProfile) => {
          // Login con Google riuscito, naviga alla home
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.handleRegistrationError(err);
        },
      });
  }

  onSubmit(): void {
    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      return;
    }

    this.isLoading = true; // Avvia il caricamento
    this.registrationErrorMessage = null;

    const { email, password, nome, cognome } = this.registrationForm.value;

    // L'username viene impostato uguale all'email, come nel codice originale.
    this.loginService
      .signUp(email, email, password, nome, cognome)
      .pipe(
        // --- MIGLIORAMENTO: `finalize` assicura che `isLoading` venga resettato ---
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: () => {
          // Dopo la registrazione, reindirizza l'utente alla pagina di login
          // con un messaggio di successo (opzionale, ma buona UX).
          this.router.navigate(['/login'], {
            queryParams: { registered: 'success' },
          });
        },
        error: (err) => {
          this.handleRegistrationError(err);
        },
      });
  }

  /**
   * --- MIGLIORAMENTO: Gestione degli errori più specifica per Django REST Framework ---
   * Legge i messaggi di errore dettagliati dal corpo della risposta.
   */
  private handleRegistrationError(err: any): void {
    console.error('Errore durante la registrazione:', err);
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        this.registrationErrorMessage =
          'Errore di rete. Controlla la tua connessione e riprova.';
      } else if (err.status === 400 && err.error) {
        // DRF di solito usa lo status 400 per errori di validazione.
        const errorBody = err.error;
        // Cerca l'errore più comune (email già esistente)
        if (errorBody.email && Array.isArray(errorBody.email)) {
          this.registrationErrorMessage = errorBody.email[0];
        } else if (errorBody.password && Array.isArray(errorBody.password)) {
          this.registrationErrorMessage = `Password: ${errorBody.password[0]}`;
        } else {
          // Fallback per altri errori di validazione
          this.registrationErrorMessage =
            'Dati non validi. Controlla i campi e riprova.';
        }
      } else {
        this.registrationErrorMessage = `Si è verificato un errore (${err.status}). Riprova più tardi.`;
      }
    } else {
      this.registrationErrorMessage =
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
