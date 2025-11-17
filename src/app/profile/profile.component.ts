// in src/app/profile.component.ts

import { Component, OnDestroy, OnInit } from '@angular/core'; // <-- Aggiungi OnDestroy
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { LoginService } from '../service/login.service';
import { SettingsComponent } from '../settings/settings.component';
import { CommonModule } from '@angular/common';
import { UserProfile } from '../shared/interfaces'; // <-- Usa l'interfaccia globale
import { Subscription } from 'rxjs'; // <-- Importa Subscription

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [MatIconModule, SettingsComponent, CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  userProfile: UserProfile | null = null;
  showSettings = false;

  // La gestione del backendUrl e del defaultPhotoUrl è già corretta
  readonly defaultPhotoUrl = '../../assets/account_circle.png';
  private readonly backendUrl = 'https://hegobck-production.up.railway.app';

  private userSubscription: Subscription | undefined;

  constructor(
    private router: Router,
    private loginService: LoginService // PLATFORM_ID non è più necessario qui, lo stato è gestito centralmente
  ) {}

  ngOnInit() {
    // --- APPROCCIO ROBUSTO E REATTIVO ---
    // Ci iscriviamo al BehaviorSubject del servizio, che è la nostra unica fonte di verità.
    this.userSubscription = this.loginService.currentUser$.subscribe((user) => {
      if (user) {
        // L'utente è loggato. Prepariamo i dati per il template.
        // Creiamo una copia per non modificare l'oggetto originale nel servizio.
        const profileForDisplay = { ...user };

        this.userProfile = profileForDisplay;
      } else {
        // Se currentUser$ emette null, significa che l'utente non è (o non è più) loggato.
        // Reindirizziamo alla pagina di login.
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnDestroy(): void {
    // È una best practice fare l'unsubscribe per prevenire memory leak.
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  openSettings() {
    this.showSettings = !this.showSettings;
  }

  Logout() {
    if (confirm('Sei sicuro di voler uscire?')) {
      // Quando fai logout, il currentUser$ nel servizio diventerà null,
      // e il nostro subscriber nel ngOnInit si attiverà, gestendo il reindirizzamento.
      this.loginService.logout().subscribe(); // Ci iscriviamo per far partire la chiamata
    }
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = this.defaultPhotoUrl;
  }
}
