import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
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

// Dichiariamo AppleID anche qui
declare var AppleID: any;

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
  isMobile: boolean = false;
  isBrowser: boolean;

  registrationForm!: FormGroup;
  registrationErrorMessage: string | null = null;
  hidePassword = true;
  isLoading = false;
  private authSubscription!: Subscription;

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    if (this.isBrowser) {
      this.isMobile = window.innerWidth < 768;
    }
  }

  constructor(
    private loginService: LoginService,
    private router: Router,
    private socialAuthService: SocialAuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.isMobile = window.innerWidth < 768;
    }
  }

  ngOnInit(): void {
    // 1. Setup Browser & Social
    if (this.isBrowser) {
      // FIX GOOGLE: Logout preventivo
      this.socialAuthService.signOut().catch(() => {});
      // Setup Apple
      this.loadAppleScript();
    }

    // 2. Form Init
    this.registrationForm = new FormGroup({
      nome: new FormControl('', [Validators.required, Validators.minLength(2)]),
      cognome: new FormControl('', [
        Validators.required,
        Validators.minLength(2),
      ]),
      dataDiNascita: new FormControl('', Validators.required),
      sesso: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
      ]),
    });

    // 3. Google Subscription
    // Nota: Usiamo loginWithGoogle anche qui, perché il backend gestisce la creazione user (SignUp) automaticamente
    this.authSubscription = this.socialAuthService.authState
      .pipe(
        filter((user): user is SocialUser => !!user),
        switchMap((user) => {
          this.isLoading = true;
          this.registrationErrorMessage = null;
          return this.loginService
            .loginWithGoogle(user)
            .pipe(catchError((err) => throwError(() => err)));
        }),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (profile: UserProfile) => {
          // Se il login/registrazione social va a buon fine, andiamo alla home
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.handleRegistrationError(err);
        },
      });
  }

  // --- APPLE LOGIC (Uguale al Login) ---
  loadAppleScript(): void {
    if (document.getElementById('apple-sdk')) return;

    const script = document.createElement('script');
    script.src =
      'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
    script.id = 'apple-sdk';
    script.onload = () => {
      AppleID.auth.init({
        clientId: 'com.hegotv.login', // Controlla il Service ID
        scope: 'name email',
        redirectURI: 'https://www.hegotv.com/registration/',
        state: 'origin:web',
        usePopup: true,
      });
    };
    document.head.appendChild(script);
  }

  async signInWithApple(): Promise<void> {
    if (!this.isBrowser || typeof AppleID === 'undefined') return;

    this.isLoading = true;
    try {
      const response = await AppleID.auth.signIn();
      // Anche qui usiamo il login service, il backend gestisce il resto
      this.loginService.loginWithApple(response).subscribe({
        next: () => this.router.navigate(['/']),
        error: (err) => {
          this.handleRegistrationError(err);
          this.isLoading = false;
        },
      });
    } catch (error) {
      console.error('Apple Sign In Error', error);
      this.isLoading = false;
    }
  }

  // --- CLASSIC REGISTRATION SUBMIT ---
  onSubmit(): void {
    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.registrationErrorMessage = null;

    const { email, password, nome, cognome } = this.registrationForm.value;

    // Chiamata esplicita per la registrazione classica via Email/Password
    // Passiamo 'email' anche come username per mantenere coerenza col backend
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
    console.error('Registration error:', err);
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        this.registrationErrorMessage = 'Errore di rete.';
      } else if (err.status === 400 && err.error) {
        const errorBody = err.error;
        if (errorBody.email) {
          this.registrationErrorMessage = Array.isArray(errorBody.email)
            ? errorBody.email[0]
            : 'Email già in uso.';
        } else if (errorBody.password) {
          this.registrationErrorMessage = `Password: ${errorBody.password[0]}`;
        } else if (errorBody.einfo) {
          this.registrationErrorMessage = errorBody.einfo;
        } else {
          this.registrationErrorMessage = 'Dati non validi. Controlla i campi.';
        }
      } else {
        this.registrationErrorMessage = `Errore server (${err.status}).`;
      }
    } else {
      this.registrationErrorMessage = 'Errore inaspettato.';
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
