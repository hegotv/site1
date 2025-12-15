import { CommonModule, isPlatformBrowser } from '@angular/common';
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

// Dichiarazione globale per Apple
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
  isMobile: boolean = false;
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
    // 1. Redirect se già loggato
    if (this.loginService.isLoggedIn$.value) {
      this.router.navigate(['/']);
      return;
    }

    // 2. Setup ambiente Browser
    if (this.isBrowser) {
      // FIX GOOGLE: Logout preventivo per evitare "token already used"
      this.socialAuthService.signOut().catch(() => {
        // Ignora errori se non c'era sessione
      });

      // Carica script Apple
      this.loadAppleScript();
    }

    // 3. Messaggi da redirect
    this.route.queryParams.subscribe((params) => {
      if (params['registered'] === 'success') {
        this.registrationSuccessMessage =
          'Registrazione completata! Ora puoi effettuare il login.';
      }
    });

    // 4. Form Init
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required]),
    });

    // 5. Google Login Subscription
    this.authSubscription = this.socialAuthService.authState
      .pipe(
        filter((user): user is SocialUser => !!user),
        switchMap((user) => {
          this.isLoading = true;
          this.loginErrorMessage = null;
          return this.loginService.loginWithGoogle(user);
        }),
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

  // --- APPLE LOGIC ---
  loadAppleScript(): void {
    if (document.getElementById('apple-sdk')) return;

    const script = document.createElement('script');
    script.src =
      'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
    script.id = 'apple-sdk';
    script.onload = () => {
      AppleID.auth.init({
        clientId: 'com.hegotv.login', // Assicurati sia il Service ID corretto
        scope: 'name email',
        redirectURI: 'https://www.hegotv.com/accounts/apple/login/callback/',
        state: 'origin:web',
        usePopup: true,
      });
    };
    document.head.appendChild(script);
  }

  async signInWithApple(): Promise<void> {
    if (!this.isBrowser || typeof AppleID === 'undefined') {
      console.error('Apple SDK non pronto');
      return;
    }

    this.isLoading = true;
    this.loginErrorMessage = null;

    try {
      const response = await AppleID.auth.signIn();
      this.loginService.loginWithApple(response).subscribe({
        next: () => this.router.navigate(['/']),
        error: (err) => {
          this.handleLoginError(err);
          this.isLoading = false;
        },
      });
    } catch (error) {
      console.error('Apple Sign In Error', error);
      this.isLoading = false;
    }
  }

  // --- FORM SUBMIT ---
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
        next: () => this.router.navigate(['/']),
        error: (err) => this.handleLoginError(err),
      });
  }

  private handleLoginError(err: any): void {
    console.error('Login error:', err);
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        this.loginErrorMessage = 'Errore di rete. Controlla la connessione.';
      } else if (err.status === 400 || err.status === 401) {
        const detail = err.error?.non_field_errors || err.error?.einfo;
        this.loginErrorMessage = Array.isArray(detail)
          ? detail[0]
          : detail || 'Credenziali non valide.';
      } else {
        this.loginErrorMessage = `Errore del server (${err.status}).`;
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
