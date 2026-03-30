// src/app/all/all.component.ts

import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../service/category.service';
import { Category } from '../shared/interfaces';
import { delay, finalize } from 'rxjs/operators';
import { FooterComponent } from '../footer/footer.component';

interface DisplayShow {
  title: string;
  slug: string | null;
  CatimageVert: string | null;
  seasonCount: number;
  episodeCount?: number;
}

@Component({
  selector: 'app-all',
  standalone: true,
  imports: [CommonModule, FooterComponent],
  templateUrl: './all.component.html',
  styleUrls: ['./all.component.css'],
})
export class AllComponent implements OnInit {
  isLoading: boolean = true;
  displayShows: DisplayShow[] = [];
  pageTitle: string = 'Tutti i Format';

  constructor(
    private router: Router,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const macro = params.get('macro');
      this.loadData(macro);
    });
  }

  loadData(macro: string | null): void {
    this.isLoading = true;
    this.pageTitle = macro ? macro : 'Tutti i Format';

    this.categoryService
      .getAllCategories()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (allCategories: Category[]) => {
          let categoriesToProcess: Category[];

          if (macro) {
            categoriesToProcess = allCategories.filter(
              (cat) => cat.macro === macro,
            );
          } else {
            categoriesToProcess = allCategories;
          }

          this.processCategories(categoriesToProcess);
        },
        error: (err) => {
          console.error(
            'Errore nel caricamento delle categorie nel componente',
            err,
          );
          this.displayShows = [];
        },
      });
  }

  private processCategories(categories: Category[]): void {
    const showsMap = new Map<string, Category[]>();

    categories.forEach((cat) => {
      // REGEX POTENZIATA: Cattura " - S1", " S1", " - Stagione 1", " Stagione 1" (ignorando maiuscole/minuscole)
      const baseTitle = cat.title
        .split(/ - S\d+| S\d+| - Stagione \d+| Stagione \d+/i)[0]
        .trim();
      if (!showsMap.has(baseTitle)) {
        showsMap.set(baseTitle, []);
      }
      showsMap.get(baseTitle)!.push(cat);
    });

    this.displayShows = Array.from(showsMap.entries())
      .map(([baseTitle, seasonsGrouped]) => {
        const sortedSeasons = [...seasonsGrouped].sort((a, b) =>
          a.title.localeCompare(b.title),
        );
        const mainSeason = sortedSeasons[0];

        const allVideosForFormat = seasonsGrouped.flatMap((cat) => cat.videos);

        // 1. Contiamo le stagioni in base al campo "season" dentro i video (Come prima)
        const episodesWithSeason = allVideosForFormat.filter(
          (v) => typeof v.season === 'number',
        );
        const uniqueSeasons = new Set(
          episodesWithSeason.map((ep) => ep.season),
        );
        const detectedSeasonCount = uniqueSeasons.size;

        // 2. Contiamo quanti oggetti "Categoria" il backend ci ha restituito per questo Show
        // Se il backend ci manda 6 categorie (es. S1, S2... S6), sappiamo di avere ALMENO 6 stagioni.
        const groupedCategoriesCount = seasonsGrouped.length;

        // IL TRUCCO MAGICO: Prendiamo il numero più alto!
        // Risolve il problema se nei vecchi video manca la proprietà "season: number"
        let seasonCount = Math.max(detectedSeasonCount, groupedCategoriesCount);

        // Fallback di sicurezza
        if (seasonCount === 0) seasonCount = 1;

        const show: DisplayShow = {
          title: baseTitle,
          slug: mainSeason.slug,
          CatimageVert: mainSeason.CatimageVert,
          seasonCount,
        };

        if (seasonCount === 1) {
          show.episodeCount = allVideosForFormat.length;
        }

        return show;
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  public goToSeason(slug: string | null): void {
    if (slug) {
      this.router.navigate(['/season', slug]);
    }
  }
}
