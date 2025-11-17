import { CommonModule } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';

// Servizi e Interfacce
import { CategoryService } from '../service/category.service';
import { LoginService } from '../service/login.service';
import { Category, Video, SavedCategory } from '../shared/interfaces';

@Component({
  selector: 'app-favorite',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './favorite.component.html',
  styleUrls: ['./favorite.component.css'],
})
export class FavoriteComponent implements OnInit, OnDestroy {
  // --- STATO DEL COMPONENTE ---
  favoriteCategories: Category[] = [];
  isLoading = true;
  private subscriptions = new Subscription();

  // --- CORREZIONE: Aggiunto ViewChild per accedere all'elemento della griglia ---
  @ViewChild('categoriesGrid', { static: false })
  categoriesGrid!: ElementRef<HTMLElement>;

  constructor(
    private router: Router,
    private categoryService: CategoryService,
    private loginService: LoginService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.loginService.isLoggedIn$.subscribe((isLoggedIn) => {
        if (isLoggedIn) {
          this.loadFavorites();
        } else {
          this.favoriteCategories = [];
          this.isLoading = false;
          this.router.navigate(['/login']);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private loadFavorites(): void {
    this.isLoading = true;

    const favoritesSub = this.categoryService
      .getFavoriteCategories()
      .pipe(
        switchMap((savedCategories: SavedCategory[]) => {
          if (savedCategories.length === 0) {
            return of([]);
          }
          const favoriteSlugs = new Set(savedCategories.map((cat) => cat.slug));
          return this.categoryService
            .getAllCategories()
            .pipe(
              map((allCategories: Category[]) =>
                allCategories.filter((cat) => favoriteSlugs.has(cat.slug))
              )
            );
        })
      )
      .subscribe((fullFavoriteCategories: Category[]) => {
        this.favoriteCategories = fullFavoriteCategories;
        this.isLoading = false;
        this.cdr.detectChanges();
      });

    this.subscriptions.add(favoritesSub);
  }

  public getUniqueSeasons(cat: Category): number {
    if (!cat.videos) return 0;
    const seasons = new Set(cat.videos.map((v: Video) => v.season));
    return seasons.size;
  }

  // --- METODI DI NAVIGAZIONE ---

  public goToSeason(slug: string): void {
    this.router.navigate(['/season', slug]);
  }

  public goToVideo(id: string): void {
    this.router.navigate(['/details', id]);
  }

  // --- CORREZIONE: Ripristinati i metodi per lo scroll ---

  /**
   * Scorre la griglia delle categorie verso sinistra.
   */
  scrollLeft(): void {
    if (this.categoriesGrid?.nativeElement) {
      const scrollAmount = this.categoriesGrid.nativeElement.clientWidth * 0.8; // Scorre dell'80% della larghezza visibile
      this.categoriesGrid.nativeElement.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth',
      });
    }
  }

  /**
   * Scorre la griglia delle categorie verso destra.
   */
  scrollRight(): void {
    if (this.categoriesGrid?.nativeElement) {
      const scrollAmount = this.categoriesGrid.nativeElement.clientWidth * 0.8;
      this.categoriesGrid.nativeElement.scrollBy({
        left: scrollAmount,
        behavior: 'smooth',
      });
    }
  }
}
