// in src/app/service/csrf.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../enviroments/enviroment'; // Assicurati di avere questo file

@Injectable({
  providedIn: 'root',
})
export class CsrfService {
  // L'URL del tuo endpoint per ottenere il token CSRF
  private csrfTokenUrl = `${environment.apiUrl}/auth/get-csrf-token/`;

  constructor(private http: HttpClient) {}

  /**
   * Effettua una richiesta GET per assicurarsi che il cookie CSRF sia
   * impostato nel browser. Questo metodo deve essere eseguito all'avvio dell'app.
   */
  public ensureCsrfCookie(): Promise<any> {
    // Usiamo withCredentials: true per gestire i cookie cross-origin
    return firstValueFrom(
      this.http.get(this.csrfTokenUrl, { withCredentials: true })
    );
  }
}
