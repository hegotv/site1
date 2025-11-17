// in src/app/app.component.ts

import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

// Componenti importati per il template
import { HeaderComponent } from './header/header.component';

// --- PASSO 1: Importa il LoginService ---
import { LoginService } from './service/login.service';
import { HomeDataService } from './service/home-data.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  private isBrowser: boolean;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private loginService: LoginService,
    private homeDataService: HomeDataService // <-- Inietta HomeDataService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      // Punto di avvio centralizzato e sicuro per tutte le chiamate iniziali
      this.loginService.checkSessionOnLoad();
      this.homeDataService.loadInitialData(); // <-- Avvia il caricamento dei dati della home

      // La tua logica esistente per lo scroll
      const routerSub = this.router.events
        .pipe(filter((event) => event instanceof NavigationEnd))
        .subscribe(() => {
          window.scrollTo(0, 0);
        });
      this.subscriptions.add(routerSub);
    }
  }

  ngOnDestroy(): void {
    // La tua logica di pulizia rimane invariata.
    this.subscriptions.unsubscribe();
  }
}
