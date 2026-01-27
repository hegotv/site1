import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';
import { testGuard } from './test.guard'; // <-- 1. Importa il NUOVO guardiano
import { seasonResolver, videoResolver } from './resolvers';

export const routes: Routes = [
  // --- ROTTE PUBBLICHE (Sempre accessibili) ---
  // Aggiungiamo qui la pagina dei lavori in corso.
  // DEVE essere fuori dall'area protetta.
  {
    path: 'lavori-in-corso',
    loadComponent: () =>
      import('./work-in-progress/work-in-progress.component').then(
        (m) => m.WorkInProgressComponent
      ),
  },

  // --- ROTTA CONTENITORE PROTETTA ---
  // Questa rotta "vuota" applica il testGuard a tutte le sue rotte figlie.
  {
    path: '',
    canActivate: [testGuard], // <-- 2. Applica il guardiano qui
    children: [
      //
      // 3. Incolla TUTTE le tue rotte originali qui dentro
      //
      { path: '', redirectTo: '/home', pathMatch: 'full' },
      {
        path: 'admin',
        loadComponent: () =>
          import('./admin/admin.component').then((m) => m.AdminComponent),
      },
      {
        path: 'home',
        // NOTA: Devi importare HomeComponent qui se non usi lazy loading
        loadComponent: () =>
          import('./home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'serie',
        loadComponent: () =>
          import('./all/all.component').then((m) => m.AllComponent),
      },
      {
        path: 'serie/:macro',
        loadComponent: () =>
          import('./all/all.component').then((m) => m.AllComponent),
      },
      {
        path: 'details',
        loadComponent: () =>
          import('./details/details.component').then((m) => m.DetailsComponent),
        resolve: { video: videoResolver },
      },
      {
        path: 'season/:categoryTitleSlug',
        loadComponent: () =>
          import('./season/season.component').then((m) => m.SeasonComponent),
        resolve: { category: seasonResolver },
      },
      {
        path: 'docufilm',
        loadComponent: () =>
          import('./docufilm/docufilm.component').then(
            (m) => m.DocufilmComponent
          ),
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./registration/registration.component').then(
            (m) => m.RegistrationComponent
          ),
      },
      {
        path: 'favorite',
        loadComponent: () =>
          import('./favorite/favorite.component').then(
            (m) => m.FavoriteComponent
          ),
        canActivate: [authGuard], // Il tuo guardiano originale continua a funzionare!
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./profile/profile.component').then((m) => m.ProfileComponent),
        canActivate: [authGuard],
      },
      {
        path: 'podcast',
        loadComponent: () =>
          import('./podcast/podcast.component').then((m) => m.PodcastComponent),
      },
      {
        path: 'podcast/:slug',
        loadComponent: () =>
          import('./allpodcast/allpodcast.component').then(
            (m) => m.AllpodcastComponent
          ),
      },
      {
        path: 'podcasts/:id',
        loadComponent: () =>
          import('./audio/audio.component').then((m) => m.AudioComponent),
      },

      // --- Rotte per Pagine Statiche (con children) ---
      {
        path: 'info',
        loadComponent: () =>
          import('./pages/info-page/info-page.component').then(
            (m) => m.InfoPageComponent
          ),
        children: [
          {
            path: 'about',
            loadComponent: () =>
              import('./pages/chi-siamo/chi-siamo.component').then(
                (m) => m.ChiSiamoComponent
              ),
          },
          {
            path: 'faq',
            loadComponent: () =>
              import('./pages/faq/faq.component').then((m) => m.FaqComponent),
          },
          {
            path: 'contacts',
            loadComponent: () =>
              import('./pages/contattaci/contattaci.component').then(
                (m) => m.ContattaciComponent
              ),
          },
          {
            path: 'privacy-policy',
            loadComponent: () =>
              import('./pages/privacy-policy/privacy-policy.component').then(
                (m) => m.PrivacyPolicyComponent
              ),
          },
          {
            path: 'terms',
            loadComponent: () =>
              import(
                './pages/termini-servizio/termini-servizio.component'
              ).then((m) => m.TerminiServizioComponent),
          },
          { path: '', redirectTo: 'about', pathMatch: 'full' },
        ],
      },
    ],
  },

  // --- Rotta Catch-all per Pagine Non Trovate ---
  {
    path: '**',
    loadComponent: () =>
      import('./page-not-found/page-not-found.component').then(
        (m) => m.PageNotFoundComponent
      ),
  },
];
