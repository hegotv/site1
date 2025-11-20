import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  Inject,
  OnDestroy,
  ChangeDetectorRef,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser, CommonModule, DOCUMENT } from '@angular/common';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {
  debounceTime,
  distinctUntilChanged,
  Subject,
  Subscription,
  forkJoin,
} from 'rxjs';

import { MenuService } from '../service/menu.service';
import { LoginService } from '../service/login.service';
import { SearchService } from '../service/search.service';
import { CategoryService } from '../service/category.service';
import { Video, Category } from '../shared/interfaces';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,

    RouterLink,
    RouterLinkActive,
  ],
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  // Riferimenti agli elementi del DOM
  @ViewChild('profileToggle') private profileToggle?: ElementRef;
  @ViewChild('profileDropdown') private profileDropdown?: ElementRef;
  @ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('customSidenavPanel') private customSidenavPanel?: ElementRef;
  @ViewChild('menuButton') private menuButton?: ElementRef;

  // Stato del componente
  isScrolled = false;
  isLoggedIn = false;
  isStateInitialized = false;
  isMobile = false;
  isDropdownOpen = false;
  isSearchActive = false;
  isSidenavOpen = false;
  isLoading = false;

  // Dati utente e ricerca
  email?: string;
  first_name?: string;
  last_name?: string;
  searchQuery = '';
  searchResults: Video[] = [];
  searchCategoryResults: Category[] = [];

  private readonly isBrowser: boolean;
  private searchSubject = new Subject<string>();
  private subscriptions = new Subscription();

  constructor(
    public router: Router,
    private menuService: MenuService,
    private loginService: LoginService,
    private searchService: SearchService,
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.checkIsMobile();
    this.setupSubscriptions();

    // Aggiunge la classe 'logged-in' al body quando l'utente è loggato
    if (this.isBrowser) {
      this.loginService.isLoggedIn$.subscribe((loggedIn) => {
        if (loggedIn) {
          this.document.body.classList.add('logged-in');
        } else {
          this.document.body.classList.remove('logged-in');
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private setupSubscriptions(): void {
    const loginSub = this.loginService.isLoggedIn$.subscribe((loggedIn) => {
      this.isLoggedIn = loggedIn;
      this.updateUserInfo();
      if (this.isBrowser && !this.isStateInitialized) {
        this.isStateInitialized = true;
      }
      this.cdr.detectChanges();
    });

    const sidenavSub = this.menuService.isSidenavOpen$.subscribe((isOpen) => {
      this.isSidenavOpen = isOpen;
      if (this.isBrowser) {
        this.document.body.style.overflow = isOpen ? 'hidden' : '';
      }
    });

    const searchSub = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((query) => this.performSearch(query));

    this.subscriptions.add(loginSub);
    this.subscriptions.add(sidenavSub);
    this.subscriptions.add(searchSub);
  }

  // --- GESTORI DI EVENTI GLOBALI ---

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.isBrowser) {
      const scrollOffset =
        window.pageYOffset ||
        this.document.documentElement.scrollTop ||
        this.document.body.scrollTop ||
        0;
      this.isScrolled = scrollOffset > 10;
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkIsMobile();
    if (this.isDropdownOpen) this.closeDropdown();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    this.handleClickOutsideDropdown(event);
    this.handleClickOutsideSearch(event);
    // La chiusura del Sidenav è già gestita nel template con il backdrop
  }

  // --- METODI DI NAVIGAZIONE E AZIONI UTENTE ---

  goToHome(): void {
    this.router.navigate(['/']);
    this.resetUIStates();
  }

  goToAccount(): void {
    this.router.navigate(['/profile']);
    this.resetUIStates();
  }

  goToWatchlist(): void {
    this.router.navigate(['/favorite']);
    this.resetUIStates();
  }

  goToVideoDetail(videoId: string): void {
    this.router.navigate(['/details'], { queryParams: { id: videoId } });
    this.resetUIStates();
  }

  goToCategory(slug: string): void {
    this.router.navigate(['/season', slug]);
    this.resetUIStates();
  }

  logout(): void {
    this.loginService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
    this.resetUIStates();
  }

  // --- GESTIONE SIDENAV ---

  toggleSidenav(): void {
    this.menuService.toggle();
    if (!this.isSidenavOpen) {
      this.resetUIStates({ keepSidenav: true });
    }
  }

  closeSidenav(): void {
    this.menuService.close();
  }

  // --- GESTIONE DROPDOWN PROFILO ---

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
    if (this.isDropdownOpen) {
      this.resetUIStates({ keepDropdown: true });
    }
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  // --- GESTIONE RICERCA ---

  toggleSearch(): void {
    this.isSearchActive = !this.isSearchActive;

    if (this.isSearchActive) {
      this.resetUIStates({ keepSearch: true });
      // Blocca lo scroll del body quando la ricerca è attiva
      if (this.isBrowser) {
        document.body.style.overflow = 'hidden';
      }
      // Aumentato il timeout per dare tempo all'animazione CSS di partire
      setTimeout(() => this.searchInput?.nativeElement.focus(), 100);
    } else {
      this.clearSearchState();
      this.searchQuery = '';
      // Ripristina lo scroll del body quando la ricerca viene chiusa
      if (this.isBrowser) {
        document.body.style.overflow = '';
      }
    }
  }

  onSearchInput(): void {
    const query = this.searchQuery.trim();
    if (query) {
      this.isLoading = true;
      this.searchResults = [];
      this.searchCategoryResults = [];
    }
    this.searchSubject.next(query);
  }

  clearSearchQuery(): void {
    this.searchQuery = '';
    this.searchSubject.next('');
    this.clearSearchState();
    // Re-imposta il focus sull'input dopo averlo pulito
    setTimeout(() => this.searchInput?.nativeElement.focus(), 0);
  }

  // --- METODI PRIVATI DI LOGICA INTERNA ---

  private updateUserInfo(): void {
    if (this.isLoggedIn && this.isBrowser) {
      const userStr = sessionStorage.getItem('userProfile');
      if (userStr) {
        const user = JSON.parse(userStr);
        this.first_name = user.first_name || '';
        this.last_name = user.last_name || '';
        this.email = user.email || '';
        return;
      }
    }
    this.first_name = undefined;
    this.last_name = undefined;
    this.email = undefined;
  }

  private performSearch(query: string): void {
    if (!query) {
      this.clearSearchState();
      return;
    }

    this.isLoading = true;
    const videos$ = this.searchService.searchVideos(query);
    const categories$ = this.categoryService.searchCategories(query);

    const searchSub = forkJoin([videos$, categories$]).subscribe({
      next: ([videos, categories]) => {
        this.searchResults = videos;
        this.searchCategoryResults = categories;
        this.isLoading = false;
      },
      error: () => {
        this.clearSearchState();
        this.isLoading = false;
      },
    });
    this.subscriptions.add(searchSub);
  }

  private checkIsMobile(): void {
    this.isMobile = this.isBrowser && window.innerWidth < 768;
  }

  private clearSearchState(): void {
    this.searchResults = [];
    this.searchCategoryResults = [];
    this.isLoading = false;
  }

  private resetUIStates(
    keep: {
      keepDropdown?: boolean;
      keepSearch?: boolean;
      keepSidenav?: boolean;
    } = {}
  ): void {
    if (!keep.keepDropdown) this.isDropdownOpen = false;
    if (!keep.keepSidenav) this.menuService.close();
    if (!keep.keepSearch) {
      this.isSearchActive = false;
      this.clearSearchState();
      this.searchQuery = '';
    }
  }

  // --- GESTORI CLICK OUTSIDE ---

  private handleClickOutsideDropdown(event: Event): void {
    const clickedElement = event.target as Node;
    if (
      this.isDropdownOpen &&
      !this.profileToggle?.nativeElement.contains(clickedElement) &&
      !this.profileDropdown?.nativeElement.contains(clickedElement)
    ) {
      this.closeDropdown();
    }
  }

  private handleClickOutsideSearch(event: Event): void {
    if (!this.isSearchActive) return;

    const clickedElement = event.target as Node;
    // MODIFICA: Aggiornato il selettore per corrispondere alla nuova struttura HTML.
    // Ora controlla se il click è avvenuto all'interno del contenitore '.search-wrapper'
    // o dell'overlay dei risultati.
    const isInside = (clickedElement as Element).closest(
      '.search-wrapper, .search-results-overlay'
    );

    if (!isInside) {
      // Se il click è esterno, chiudiamo la ricerca.
      this.resetUIStates({ keepSearch: false });
    }
  }

  // Funzione trackBy per ottimizzare ngFor nei risultati di ricerca
  trackByVideoId(index: number, video: Video): string {
    return video.id;
  }
}
