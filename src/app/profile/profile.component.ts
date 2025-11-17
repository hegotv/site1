// in src/app/profile.component.ts

import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { LoginService } from '../service/login.service';
import { CommonModule } from '@angular/common';
import { UserProfile } from '../shared/interfaces';
import { Subscription } from 'rxjs';
import { SettingsComponent } from '../settings/settings.component'; // <-- Importa SettingsComponent

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [MatIconModule, CommonModule, SettingsComponent], // <-- Aggiungilo agli imports
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  userProfile: UserProfile | null = null;
  showSettings = false; // Proprietà per mostrare/nascondere il modale
  private userSubscription: Subscription | undefined;

  constructor(private router: Router, private loginService: LoginService) {}

  ngOnInit() {
    this.userSubscription = this.loginService.currentUser$.subscribe((user) => {
      if (user) {
        this.userProfile = user;
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  openSettings() {
    this.showSettings = true;
  }

  closeSettingsModal() {
    this.showSettings = false;
  }

  Logout() {
    if (confirm('Sei sicuro di voler uscire?')) {
      this.loginService.logout().subscribe();
    }
  }
}
