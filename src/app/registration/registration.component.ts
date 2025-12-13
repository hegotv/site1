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
import {
  Subscription,
  filter,
  switchMap,
  finalize,
  catchError,
  throwError,
} from 'rxjs';
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
  isMobile: boolean = window.innerWidth < 768;

  registrationForm!: FormGroup;
  registrationErrorMessage: string | null = null;
  hidePassword = true;
  isLoading = false;
  private authSubscription!: Subscription;

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

      // --- CORREZIONE: Queste righe DEVONO essere attive se i campi sono nell'HTML ---
      dataDiNascita: new FormControl('', Validators.required),
      sesso: new FormControl('', Validators.required),
      // -----------------------------------------------------------------------------

      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
      ]),
    });

    this.authSubscription = this.socialAuthService.authState
      .pipe(
        filter((user): user is SocialUser => !!user),
        switchMap((user) =>
          this.loginService.loginWithGoogle(user).pipe(
            catchError((err: any) => {
              return throwError(() => err);
            })
          )
        )
      )
      .subscribe({
        next: (profile: UserProfile) => {
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

    this.isLoading = true;
    this.registrationErrorMessage = null;

    // Recupera tutti i valori, inclusi quelli che avevi commentato
    const { email, password, nome, cognome, dataDiNascita, sesso } =
      this.registrationForm.value;

    // NOTA: Se il tuo servizio backend 'signUp' non accetta dataDiNascita e sesso,
    // semplicemente non passarli alla funzione qui sotto, ma lasciali nel form sopra
    // affinché la validazione visiva funzioni.
    this.loginService
      .signUp(email, email, password, nome, cognome)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.router.navigate(['/login'], {
            queryParams: { registered: 'success' },
          });
        },
        error: (err) => {
          this.handleRegistrationError(err);
        },
      });
  }

  private handleRegistrationError(err: any): void {
    console.error('Errore durante la registrazione:', err);
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        this.registrationErrorMessage =
          'Errore di rete. Controlla la tua connessione e riprova.';
      } else if (err.status === 400 && err.error) {
        const errorBody = err.error;
        if (errorBody.email && Array.isArray(errorBody.email)) {
          this.registrationErrorMessage = errorBody.email[0];
        } else if (errorBody.password && Array.isArray(errorBody.password)) {
          this.registrationErrorMessage = `Password: ${errorBody.password[0]}`;
        } else {
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
