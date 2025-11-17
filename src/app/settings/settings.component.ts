// src/app/settings/settings.component.ts

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
import { LoginService } from '../service/login.service'; // Importa UserProfile
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
  user: UserProfile | null = null;
  selectedFile: File | null = null;
  profilePictureUrl: string | ArrayBuffer | null =
    '../../assets/account_circle.png';
  updateError: boolean = false;
  updateSuccess: boolean = false;
  private userSubscription: Subscription | undefined;

  constructor(private loginService: LoginService, private router: Router) {}

  ngOnInit(): void {
    // <<<<<<<<<<<<<<<<<<< CORREZIONE 1: Inizializza il form PRIMA di usarlo.
    this.settingsForm = new FormGroup({
      first_name: new FormControl('', Validators.required),
      last_name: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl(''), // Password opzionale
    });

    this.userSubscription = this.loginService.currentUser$.subscribe((user) => {
      if (user) {
        this.user = user;
        // Usa i nomi corretti dei campi del profilo (first_name, last_name)
        this.settingsForm.patchValue({
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
        });
        if (user.profile_picture_url) {
          this.profilePictureUrl = user.profile_picture_url;
        }
      } else {
        // Se non c'è utente, reindirizza al login
        this.router.navigate(['/login']);
      }
    });
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      this.selectedFile = fileList[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.profilePictureUrl = reader.result;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  // <<<<<<<<<<<<<<<<<<< CORREZIONE 2: Costruisci e invia un oggetto FormData
  onSubmit(): void {
    if (this.settingsForm.invalid) {
      return;
    }
    this.updateError = false;
    this.updateSuccess = false;

    // 1. Crea un nuovo oggetto FormData
    const formData = new FormData();

    // 2. Aggiungi i valori del form all'oggetto FormData
    //    Le chiavi ('first_name', 'last_name', etc.) devono corrispondere ai nomi dei campi nel tuo serializer Django
    formData.append('first_name', this.settingsForm.get('first_name')?.value);
    formData.append('last_name', this.settingsForm.get('last_name')?.value);
    formData.append('email', this.settingsForm.get('email')?.value);

    // 3. Aggiungi la password solo se l'utente ne ha inserita una nuova
    const password = this.settingsForm.get('password')?.value;
    if (password) {
      formData.append('password', password);
    }

    // 4. Aggiungi il file dell'immagine del profilo solo se ne è stato selezionato uno nuovo
    if (this.selectedFile) {
      // La chiave 'profile_picture' deve corrispondere al nome del campo nel tuo modello/serializer Django
      formData.append(
        'profile_picture',
        this.selectedFile,
        this.selectedFile.name
      );
    }

    // 5. Chiama il servizio con l'oggetto FormData
    this.loginService.updateProfile(formData).subscribe({
      next: (updatedProfile) => {
        this.updateSuccess = true;
        // Opzionale: chiudi le impostazioni dopo un breve ritardo
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
