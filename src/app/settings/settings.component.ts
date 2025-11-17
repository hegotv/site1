// in src/app/settings/settings.component.ts

import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LoginService } from '../service/login.service';
import { UserProfile } from '../shared/interfaces';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent implements OnInit, OnDestroy {
  @Output() closeSettings = new EventEmitter<void>();
  settingsForm!: FormGroup;
  updateError: boolean = false;
  updateSuccess: boolean = false;
  private userSubscription: Subscription | undefined;

  constructor(private loginService: LoginService, private router: Router) {}

  ngOnInit(): void {
    this.settingsForm = new FormGroup({
      // Usiamo i nomi dei campi che il tuo backend si aspetta (name, surname)
      name: new FormControl('', Validators.required),
      surname: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl(''), // Password è opzionale, nessun validatore
    });

    this.userSubscription = this.loginService.currentUser$.subscribe((user) => {
      if (user) {
        // Pre-compila il form con i dati dell'utente corrente
        this.settingsForm.patchValue({
          name: user.first_name,
          surname: user.last_name,
          email: user.email,
        });
      } else {
        // Se per qualche motivo l'utente non è più loggato, torna al login
        this.router.navigate(['/login']);
      }
    });
  }

  onSubmit(): void {
    if (this.settingsForm.invalid) {
      return;
    }
    this.updateError = false;
    this.updateSuccess = false;

    // Crea un oggetto payload pulito con i valori del form
    const formData = { ...this.settingsForm.value };

    // Rimuovi la password dal payload se è una stringa vuota
    if (!formData.password) {
      delete formData.password;
    }

    // Chiama il servizio con l'oggetto JSON
    // Assicurati che il tuo LoginService.updateProfile accetti un oggetto UserProfile parziale
    this.loginService.updateProfile(formData).subscribe({
      next: () => {
        this.updateSuccess = true;
        // Chiudi il modale dopo 2 secondi
        setTimeout(() => this.close(), 2000);
      },
      error: (err) => {
        console.error("Errore durante l'aggiornamento del profilo:", err);
        this.updateError = true;
      },
    });
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }

  close() {
    this.closeSettings.emit();
  }
}
