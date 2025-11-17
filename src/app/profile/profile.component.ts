import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { LoginService } from '../service/login.service';
import { SettingsComponent } from '../settings/settings.component';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';

// SUGGERIMENTO 1: Creare un'interfaccia per la tipizzazione
interface UserProfile {
  email: string;
  name?: string;
  surname?: string;
  photo?: string; // Il percorso relativo dell'immagine, es. /media/photos/user.jpg
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [MatIconModule, SettingsComponent, CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'], // Corretto da styleUrl a styleUrls
})
export class ProfileComponent implements OnInit {
  userProfile: UserProfile | null = null;
  showSettings = false;

  // SUGGERIMENTO 2: Fornire un'immagine di fallback di default
  readonly defaultPhotoUrl = '../../assets/account_circle.png';

  // L'URL del tuo backend dovrebbe provenire da un file di configurazione (environment.ts)
  // Per ora lo lasciamo qui per semplicità
  private readonly backendUrl = 'https://hegobck-production.up.railway.app';

  constructor(
    private router: Router,
    private loginService: LoginService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const userStr = sessionStorage.getItem('userProfile');
      if (!userStr) {
        this.router.navigate(['/login']);
        return;
      }

      // Ora usiamo l'interfaccia per avere codice più sicuro
      const user: UserProfile = JSON.parse(userStr);

      // SUGGERIMENTO 3: Costruire l'URL completo solo se la foto esiste
      if (user.photo) {
        // Assicurati che il percorso della foto dal backend inizi con /media/
        user.photo = `${this.backendUrl}${user.photo}`;
      }

      this.userProfile = user;
    }
  }

  openSettings() {
    this.showSettings = !this.showSettings;
  }

  Logout() {
    // SUGGERIMENTO 4 (UX): Chiedere conferma prima del logout
    if (confirm('Sei sicuro di voler uscire?')) {
      this.loginService.logout();
      this.router.navigate(['/login']);
    }
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = this.defaultPhotoUrl;
  }
}
