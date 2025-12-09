import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';

// Interfaccia per tipizzare i dati utente che arrivano dal backend
interface UserData {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  joined_at: string;
}

interface AdminResponse {
  response: string;
  count?: number;
  users?: UserData[];
  einfo?: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent {
  // Variabili di stato
  password: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  showResults: boolean = false;

  // Dati ricevuti
  users: UserData[] = [];
  todayCount: number = 0;

  // URL del tuo backend
  private apiUrl =
    'https://hegobck-production.up.railway.app/auth/admin/daily-users/';

  constructor(private http: HttpClient) {}

  getDailyUsers() {
    // Reset errori e stato
    this.errorMessage = '';

    if (!this.password) {
      this.errorMessage = 'Inserisci la password.';
      return;
    }

    this.isLoading = true;

    // --- MODIFICA: Rimossi i controlli sul token ---

    // Prepariamo solo il Content-Type, niente Authorization
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    // Body della richiesta con la password admin
    const body = {
      admin_password: this.password,
    };

    // Chiamata HTTP
    this.http.post<AdminResponse>(this.apiUrl, body, { headers }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.response === 'ok' && res.users) {
          this.users = res.users;
          this.todayCount = res.count || 0;
          this.showResults = true; // Mostra la tabella
        } else {
          this.errorMessage = res.einfo || 'Errore sconosciuto.';
        }
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        console.error('Admin Error:', error);

        if (error.status === 403) {
          // 403 ora indica solo che la password admin è sbagliata
          this.errorMessage = 'Password errata.';
        } else {
          this.errorMessage = 'Errore del server. Riprova più tardi.';
        }
      },
    });
  }

  resetView() {
    // Torna alla schermata di inserimento password
    this.showResults = false;
    this.users = [];
    this.password = '';
  }
}
