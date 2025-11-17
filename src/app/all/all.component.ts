// src/app/all/all.component.ts

import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../service/category.service';
import { Category } from '../shared/interfaces';
import { finalize } from 'rxjs/operators';

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
  imports: [CommonModule],
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
    private route: ActivatedRoute
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
              (cat) => cat.macro === macro
            );
          } else {
            categoriesToProcess = allCategories;
          }

          this.processCategories(categoriesToProcess);
        },
        error: (err) => {
          console.error(
            'Errore nel caricamento delle categorie nel componente',
            err
          );
          this.displayShows = [];
        },
      });
  }

  private processCategories(categories: Category[]): void {
    const showsMap = new Map<string, Category[]>();

    categories.forEach((cat) => {
      const baseTitle = cat.title.split(/ - S\d*| S\d*/)[0].trim();
      if (!showsMap.has(baseTitle)) {
        showsMap.set(baseTitle, []);
      }
      showsMap.get(baseTitle)!.push(cat);
    });

    this.displayShows = Array.from(showsMap.entries())
      .map(([baseTitle, seasons]) => {
        const sortedSeasons = [...seasons].sort((a, b) =>
          a.title.localeCompare(b.title)
        );
        const mainSeason = sortedSeasons[0];

        // ===================================================================
        // <<<<<<<<<<<<<<<<<<<<<<< INIZIO DELLA CORREZIONE >>>>>>>>>>>>>>>>>>>
        // ===================================================================

        // 1. Raccogliamo TUTTI i video da tutte le categorie che compongono questo format
        //    (es. da "HeTalk" e "HeTalk 2" se esistono entrambe).
        const allVideosForFormat = seasons.flatMap((cat) => cat.videos);

        // 2. Estraiamo i numeri di stagione da ogni video.
        const seasonNumbers = allVideosForFormat.map((video) => video.season);

        // 3. Usiamo un Set per ottenere solo i numeri di stagione UNICI e contiamo quanti sono.
        //    Questo è il numero reale di stagioni per il format.
        const seasonCount = new Set(seasonNumbers).size;

        const show: DisplayShow = {
          title: baseTitle,
          slug: mainSeason.slug,
          CatimageVert: mainSeason.CatimageVert,
          seasonCount: seasonCount, // Usiamo il conteggio corretto
        };

        // 4. Se il numero di stagioni uniche è 1, allora mostriamo il conteggio totale degli episodi.
        if (seasonCount === 1) {
          show.episodeCount = allVideosForFormat.length; // Usiamo la lunghezza totale dei video
        }

        // ===================================================================
        // <<<<<<<<<<<<<<<<<<<<<<<< FINE DELLA CORREZIONE >>>>>>>>>>>>>>>>>>>>
        // ===================================================================

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
