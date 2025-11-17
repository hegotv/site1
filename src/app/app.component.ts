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

    // --- PASSO 2: Inietta il LoginService ---
    private loginService: LoginService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // La logica esistente viene eseguita solo nel browser, il che è corretto.
    if (this.isBrowser) {
      // --- PASSO 3: Chiama checkSessionOnLoad() qui ---
      // Questo viene eseguito DOPO che l'APP_INITIALIZER ha finito,
      // garantendo che il cookie CSRF esista prima di questa chiamata.
      this.loginService.checkSessionOnLoad();

      // La tua logica esistente per lo scroll rimane invariata.
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
