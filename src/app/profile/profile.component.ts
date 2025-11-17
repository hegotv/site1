// in src/app/profile.component.ts

import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { LoginService } from '../service/login.service';
import { CommonModule } from '@angular/common';
import { UserProfile } from '../shared/interfaces';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  // Rimuovi SettingsComponent dagli imports se non lo usi più qui
  imports: [MatIconModule, CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  userProfile: UserProfile | null = null;
  private userSubscription: Subscription | undefined;

  constructor(private router: Router, private loginService: LoginService) {}

  ngOnInit() {
    // La logica per recuperare l'utente dal servizio rimane la stessa, è corretta.
    this.userSubscription = this.loginService.currentUser$.subscribe((user) => {
      if (user) {
        // L'utente è loggato, salviamo il suo profilo.
        this.userProfile = user;
      } else {
        // Se non c'è utente, reindirizziamo al login.
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnDestroy(): void {
    // È sempre una buona pratica fare l'unsubscribe.
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  Logout() {
    if (confirm('Sei sicuro di voler uscire?')) {
      this.loginService.logout().subscribe({
        // Aggiungiamo un blocco 'next' o 'complete' per chiarezza.
        // Il reindirizzamento verrà gestito automaticamente dal subscriber in ngOnInit.
        complete: () => {
          console.log('Logout completato.');
        },
      });
    }
  }
}
