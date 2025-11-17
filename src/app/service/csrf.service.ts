// in src/app/service/csrf.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, BehaviorSubject } from 'rxjs'; // <-- Importa BehaviorSubject
import { environment } from '../../enviroments/enviroment';

@Injectable({
  providedIn: 'root',
})
export class CsrfService {
  private csrfTokenUrl = `${environment.apiUrl}/auth/csrf/`;

  // 1. Creiamo un "semaforo" (BehaviorSubject) che parte da 'false'
  private isReady = new BehaviorSubject<boolean>(false);
  // 2. Esponiamo il semaforo come un Observable pubblico
  public isReady$ = this.isReady.asObservable();

  constructor(private http: HttpClient) {}

  // 3. Questo metodo verrà chiamato dall'APP_INITIALIZER
  public init(): Promise<any> {
    return firstValueFrom(
      this.http.get(this.csrfTokenUrl, { withCredentials: true })
    )
      .then(() => {
        // 4. Quando la chiamata ha successo, diamo il via libera!
        this.isReady.next(true);
      })
      .catch((err) => {
        console.error('Impossibile ottenere il token CSRF iniziale.', err);
        // Anche in caso di errore, diamo il via libera per non bloccare l'app,
        // ma le successive chiamate POST falliranno (il che è corretto).
        this.isReady.next(true);
      });
  }
}
