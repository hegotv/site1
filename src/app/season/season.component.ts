import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CommonModule,
  ViewportScroller,
  isPlatformBrowser,
} from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

// Servizi, Pipe e Interfacce
import { ViewsFormatPipe } from '../views-format.pipe';
import { FormatDurationPipe } from '../format-duration.pipe';
import { CategoryService } from '../service/category.service';
import { LoginService } from '../service/login.service';
import { Category, Video, SavedCategory } from '../shared/interfaces'; // Importa anche SavedCategory

@Component({
  selector: 'app-season',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    FormsModule,
    FormatDurationPipe,
    ViewsFormatPipe,
  ],
  templateUrl: './season.component.html',
  styleUrls: ['./season.component.css'],
})
export class SeasonComponent implements OnInit, OnDestroy {
  // --- STATO DEL COMPONENTE ---
  isLoading = true;
  isLoggedIn = false;
  isTogglingFavorite = false; // Stato di caricamento per il pulsante "preferiti"

  selectedCategory: Category | null = null;
  selectedSeason: number | null = null;
  availableSeasons: number[] = [];
  filteredEpisodes: Video[] = [];
  hoveredEpisode: Video | null = null;

  private favoriteCategorySlugs = new Set<string>();
  private subscriptions = new Subscription();
  public readonly baseUrl = 'https://hegobck-production.up.railway.app';
  public isMobile = false;

  private isBrowser: boolean;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private categoryService: CategoryService,
    private loginService: LoginService,
    private cdr: ChangeDetectorRef, // Inietta per aggiornamenti UI
    @Inject(PLATFORM_ID) private platformId: Object,
    private viewportScroller: ViewportScroller
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.isMobile = window.innerWidth <= 768;
    }
    // Sottoscrizione allo stato di login per caricare i preferiti
    this.subscriptions.add(
      this.loginService.isLoggedIn$.subscribe((loggedIn) => {
        this.isLoggedIn = loggedIn;
        if (loggedIn) {
          this.loadFavoriteCategories();
        } else {
          this.favoriteCategorySlugs.clear(); // Pulisci i preferiti se l'utente fa logout
        }
      })
    );

    // Dati pre-caricati dal resolver
    this.subscriptions.add(
      this.activatedRoute.data.subscribe(({ category }) => {
        if (category) {
          this.handleCategoryData(category);
        }
        this.isLoading = false; // Il caricamento iniziale è terminato (con o senza dati)
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private loadFavoriteCategories(): void {
    this.subscriptions.add(
      // --- CORREZIONE: Il tipo ricevuto è `SavedCategory[]` ---
      this.categoryService
        .getFavoriteCategories()
        .subscribe((savedCategories: SavedCategory[]) => {
          this.favoriteCategorySlugs = new Set(
            (savedCategories || []).map((cat) => cat.slug)
          );
        })
    );
  }

  private handleCategoryData(category: Category): void {
    this.selectedCategory = category;
    const episodesWithSeason = this.selectedCategory.videos.filter(
      (v) => typeof v.season === 'number'
    );

    // Estrai e ordina le stagioni uniche
    this.availableSeasons = [
      ...new Set(episodesWithSeason.map((ep) => ep.season)),
    ].sort((a, b) => a - b);

    // Seleziona la prima stagione disponibile o imposta null se non ce ne sono
    this.selectedSeason =
      this.availableSeasons.length > 0 ? this.availableSeasons[0] : null;
    this.filterEpisodesBySeason();
  }

  // --- LOGICA DI INTERAZIONE UI ---

  isFavorite(): boolean {
    return (
      !!this.selectedCategory &&
      this.favoriteCategorySlugs.has(this.selectedCategory.slug)
    );
  }

  toggleFavorite(): void {
    if (!this.isLoggedIn || !this.selectedCategory || this.isTogglingFavorite)
      return;

    this.isTogglingFavorite = true;
    const slug = this.selectedCategory.slug;
    const action$ = this.isFavorite()
      ? this.categoryService.removeFavoriteCategory(slug)
      : this.categoryService.saveFavoriteCategory(slug);

    this.subscriptions.add(
      action$
        .pipe(
          finalize(() => {
            this.isTogglingFavorite = false;
            this.cdr.detectChanges(); // Assicura che il pulsante si riattivi
          })
        )
        .subscribe(() => {
          // Aggiorna lo stato locale in modo ottimistico
          if (this.favoriteCategorySlugs.has(slug)) {
            this.favoriteCategorySlugs.delete(slug);
          } else {
            this.favoriteCategorySlugs.add(slug);
          }
        })
    );
  }

  filterEpisodesBySeason(): void {
    // 3. Salviamo la posizione attuale dello scroll (asse Y)
    const currentScrollPosition = this.viewportScroller.getScrollPosition();

    if (this.selectedSeason === null || !this.selectedCategory) {
      this.filteredEpisodes = [];
      return;
    }

    this.filteredEpisodes = this.selectedCategory.videos.filter(
      (episode) => episode.season === this.selectedSeason
    );

    // 4. Forziamo il rilevamento dei cambiamenti per aggiornare il DOM
    this.cdr.detectChanges();

    // 5. Ripristiniamo la posizione dello scroll.
    // Se il sito ha `scroll-behavior: smooth` impostato via CSS, la chiamata
    // a `scrollToPosition` verrà animata — per evitare l'animazione forziamo
    // temporaneamente `scroll-behavior: auto` nel browser e poi lo ripristiniamo.
    requestAnimationFrame(() => {
      if (this.isBrowser) {
        const docEl = document.documentElement as HTMLElement;
        const prev = docEl.style.scrollBehavior;
        docEl.style.scrollBehavior = 'auto';
        this.viewportScroller.scrollToPosition(currentScrollPosition);
        // Ripristina lo style dopo il prossimo frame per non alterare il comportamento globale
        requestAnimationFrame(() => {
          docEl.style.scrollBehavior = prev || '';
        });
      } else {
        this.viewportScroller.scrollToPosition(currentScrollPosition);
      }
    });
  }

  onEpisodeHover(episode: Video): void {
    this.hoveredEpisode = episode;
  }

  onEpisodeLeave(): void {
    this.hoveredEpisode = null;
  }

  // --- NAVIGAZIONE ---

  /** --- MIGLIORAMENTO: Navigazione moderna con parametri di rotta --- */
  goToVideo(id: string): void {
    if (id) {
      this.router.navigate(['/details'], { queryParams: { id: id } });
    }
  }

  // --- OTTIMIZZAZIONE TEMPLATE ---
  trackById(index: number, item: Video): string {
    return item.id;
  }
}
