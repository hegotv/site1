import { CommonModule, isPlatformBrowser } from '@angular/common'; // Import isPlatformBrowser
import {
  Component,
  OnDestroy,
  OnInit,
  HostListener,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
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
import { filter, Subscription, switchMap, finalize } from 'rxjs';
import {
  SocialAuthService,
  SocialUser,
  GoogleSigninButtonModule,
} from '@abacritt/angularx-social-login';
import { HttpErrorResponse } from '@angular/common/http';

// Dichiariamo la variabile globale AppleID per TypeScript
declare var AppleID: any;

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
  isMobile: boolean = false; // Inizializzato dopo
  isBrowser: boolean;

  loginForm!: FormGroup;
  loginErrorMessage: string | null = null;
  registrationSuccessMessage: string | null = null;
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
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.isMobile = window.innerWidth < 768;
    }
  }

  ngOnInit(): void {
    if (this.loginService.isLoggedIn$.value) {
      this.router.navigate(['/']);
      return;
    }

    // Carica lo script Apple SOLO se siamo nel browser
    if (this.isBrowser) {
      this.loadAppleScript();
    }

    this.route.queryParams.subscribe((params) => {
      if (params['registered'] === 'success') {
        this.registrationSuccessMessage =
          'Registrazione completata! Ora puoi effettuare il login.';
      }
    });

    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required]),
    });

    // Sottoscrizione a Google
    this.authSubscription = this.socialAuthService.authState
      .pipe(
        filter((user): user is SocialUser => !!user),
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

  // --- LOGICA APPLE ---

  loadAppleScript(): void {
    // Evitiamo di ricaricare se esiste già
    if (document.getElementById('apple-sdk')) return;

    const script = document.createElement('script');
    script.src =
      'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
    script.id = 'apple-sdk';
    script.onload = () => {
      // Inizializza Apple SDK una volta caricato
      AppleID.auth.init({
        clientId: 'com.hegotv.login', // IL TUO SERVICE ID
        scope: 'name email',
        // Deve corrispondere a quello inserito in Apple Developer -> Service ID -> Return URLs
        redirectURI: 'https://www.hegotv.com/accounts/apple/login/callback/',
        state: 'origin:web',
        usePopup: true, // Importante per SPA
      });
    };
    document.head.appendChild(script);
  }

  async signInWithApple(): Promise<void> {
    if (!this.isBrowser || typeof AppleID === 'undefined') {
      console.error('Apple SDK non caricato');
      return;
    }

    this.isLoading = true;
    try {
      // Apre il popup nativo Apple
      const response = await AppleID.auth.signIn();

      // Se il login ha successo, invia i dati al backend
      this.loginService.loginWithApple(response).subscribe({
        next: (profile) => {
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.handleLoginError(err);
          this.isLoading = false;
        },
      });
    } catch (error) {
      console.error('Apple Sign In Error', error);
      this.loginErrorMessage = 'Login con Apple annullato o fallito.';
      this.isLoading = false;
    }
  }

  // --- FINE LOGICA APPLE ---

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.loginErrorMessage = null;
    this.registrationSuccessMessage = null;

    const { email, password } = this.loginForm.value;

    this.loginService
      .login(email, password)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (profile: UserProfile) => {
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.handleLoginError(err);
        },
      });
  }

  private handleLoginError(err: any): void {
    console.error('Errore durante il login:', err);
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        this.loginErrorMessage =
          'Errore di rete. Controlla la tua connessione e riprova.';
      } else if (err.status === 400 || err.status === 401) {
        const errorDetail = err.error?.non_field_errors;
        this.loginErrorMessage = Array.isArray(errorDetail)
          ? errorDetail[0]
          : 'Credenziali non valide o errore provider.';
      } else {
        this.loginErrorMessage = `Errore (${err.status}). Riprova più tardi.`;
      }
    } else {
      this.loginErrorMessage = 'Errore inaspettato.';
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
