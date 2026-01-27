import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
// RIMOSSO: FormsModule non è più necessario
import { Subject, EMPTY } from 'rxjs';
import {
  takeUntil,
  finalize,
  switchMap,
  catchError,
  tap,
  delay,
} from 'rxjs/operators';

import {
  PodcastService,
  PodcastEpisode,
  PodcastSeason,
} from '../service/podcast.service';

@Component({
  selector: 'app-allpodcast',
  standalone: true,
  // RIMOSSO: FormsModule
  imports: [CommonModule],
  templateUrl: './allpodcast.component.html',
  styleUrls: ['./allpodcast.component.css'],
})
export class AllpodcastComponent implements OnInit, OnDestroy {
  isLoading = true;
  season: PodcastSeason | null = null;

  // RIMOSSE le proprietà per il filtro
  // allEpisodes: PodcastEpisode[] = [];
  // filteredEpisodes: PodcastEpisode[] = [];
  // searchQuery = '';

  private destroy$ = new Subject<void>();

  private podcastService = inject(PodcastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        tap(() => {
          this.isLoading = true;
          this.season = null;
        }),
        switchMap((params) => {
          const slug = params.get('slug');
          if (!slug) {
            console.error("Slug della stagione non trovato nell'URL");
            this.router.navigate(['/podcast']);
            return EMPTY;
          }
          return this.podcastService.getSeasonDetails(slug).pipe(
            catchError((err) => {
              console.error('Errore nel caricamento della stagione:', err);
              this.router.navigate(['/podcast']);
              return EMPTY;
            }),
          );
        }),
        finalize(() => (this.isLoading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe((seasonData) => {
        // Ora salviamo solo l'oggetto 'season', che contiene già la lista di episodi
        this.season = seasonData;
        this.isLoading = false;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // RIMOSSA: La funzione filterEpisodes() non serve più

  /**
   * Naviga alla pagina del player per l'episodio selezionato.
   */
  playPodcast(episode: PodcastEpisode): void {
    this.router.navigate(['/podcasts/', episode.id]);
  }
}
