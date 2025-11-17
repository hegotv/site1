import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { testGuard } from '../test.guard'; // Assicurati che il percorso sia corretto
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-work-in-progress',
  templateUrl: './work-in-progress.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./work-in-progress.component.css'],
})
export class WorkInProgressComponent {
  // Controlla quale sezione mostrare (lavori in corso o login)
  showLogin = false;
  enteredPassword = '';

  private logoClickCount = 0;
  private readonly CLICKS_TO_UNLOCK = 3;

  constructor(private router: Router) {}

  /**
   * Chiamato quando l'utente clicca sul logo.
   * Dopo 3 click, mostra il form di login.
   */
  onLogoClick(): void {
    this.logoClickCount++;
    if (this.logoClickCount >= this.CLICKS_TO_UNLOCK) {
      this.showLogin = true;
    }
  }

  /**
   * Chiamato quando l'utente invia il form di login.
   */
  onSubmit(): void {
    // Confronta la password inserita con quella statica definita nel Guard
    if (this.enteredPassword === testGuard.PASSWORD) {
      // Imposta un flag nella sessione del browser per "ricordare" l'autenticazione
      sessionStorage.setItem('is-authenticated', 'true');
      // Reindirizza alla home page reale dell'applicazione
      this.router.navigate(['/']);
    } else {
      alert('Password non corretta!');
      this.enteredPassword = '';
    }
  }
}
