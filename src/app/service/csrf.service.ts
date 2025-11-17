// in src/app/service/csrf.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../enviroments/enviroment';

@Injectable({
  providedIn: 'root',
})
export class CsrfService {
  // --- CORREZIONE: Usa l'URL corretto definito in Django ---
  private csrfTokenUrl = `${environment.apiUrl}/auth/csrf/`;

  constructor(private http: HttpClient) {}

  public ensureCsrfCookie(): Promise<any> {
    return firstValueFrom(
      this.http.get(this.csrfTokenUrl, { withCredentials: true })
    );
  }
}
