import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { QrCodeComponent } from '../qr-code/qr-code.component'; // Assicurati che il percorso sia corretto

interface UserData {
  id: number;
  username: string | null;
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
  imports: [CommonModule, FormsModule, QrCodeComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent implements OnInit, OnDestroy {
  // Login State
  password: string = '';
  isLoading: boolean = false;
  isLocked: boolean = false; // Nuovo: Blocco pulsante
  errorMessage: string = '';
  isAuthenticated: boolean = false;

  // Security & Auto-Logout
  private inactivityTimer: any;
  private readonly INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 Minuti

  // Dashboard State
  activeTab: 'users' | 'qrcode' = 'users';
  isSidebarOpen: boolean = false;

  // Data
  users: UserData[] = [];
  todayCount: number = 0;

  private apiUrl =
    'https://hegobck-production.up.railway.app/auth/admin/daily-users/';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.resetInactivityTimer();
  }

  ngOnDestroy() {
    clearTimeout(this.inactivityTimer);
  }

  // Event listener per resetare il timer se l'utente muove il mouse o scrive
  @HostListener('window:mousemove')
  @HostListener('window:keypress')
  resetInactivityTimer() {
    if (this.isAuthenticated) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = setTimeout(() => {
        this.logout('Sessione scaduta per inattività.');
      }, this.INACTIVITY_LIMIT);
    }
  }

  loginAndFetch() {
    this.errorMessage = '';

    // Security: Trim degli spazi
    const cleanPass = this.password.trim();

    if (!cleanPass) {
      this.errorMessage = 'Inserisci la password.';
      return;
    }

    if (this.isLocked) return; // Impedisce click multipli durante il blocco

    this.isLoading = true;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = { admin_password: cleanPass };

    this.http.post<any>(this.apiUrl, body, { headers }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.response === 'ok' && res.users) {
          this.users = res.users;
          this.todayCount = res.count || 0;
          this.isAuthenticated = true;
          this.resetInactivityTimer(); // Avvia timer sicurezza
        } else {
          this.handleLoginError(res.einfo || 'Errore sconosciuto.');
        }
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        if (error.status === 403) {
          this.handleLoginError('Password errata.');
        } else {
          this.errorMessage = 'Errore server. Riprova più tardi.';
        }
      },
    });
  }

  // Gestione errore con "Cooldown" per evitare Brute Force
  private handleLoginError(msg: string) {
    this.errorMessage = msg;
    this.isLocked = true; // Blocca input
    setTimeout(() => {
      this.isLocked = false; // Sblocca dopo 2 secondi
    }, 2000);
  }

  refreshUsers() {
    if (this.isAuthenticated) this.loginAndFetch();
  }

  switchTab(tab: 'users' | 'qrcode') {
    this.activeTab = tab;
    this.isSidebarOpen = false;
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  logout(reason: string = '') {
    this.isAuthenticated = false;
    this.users = [];
    this.password = '';
    this.activeTab = 'users';
    this.isSidebarOpen = false;
    this.errorMessage = reason; // Mostra eventuale messaggio di timeout
    clearTimeout(this.inactivityTimer);
  }
}
