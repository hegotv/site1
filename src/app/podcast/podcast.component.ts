// src/app/podcast/podcast.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize, delay } from 'rxjs/operators';

// Importa il servizio e le interfacce aggiornate
import {
  PodcastService,
  PodcastSection,
  PodcastEpisode,
  PodcastSeason, // PodcastEpisode potrebbe non essere usato direttamente qui, ma è bene averlo
} from '../service/podcast.service';
import { SliderComponent } from '../slider/slider.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-podcast',
  standalone: true,
  imports: [CommonModule, SliderComponent, FooterComponent],
  templateUrl: './podcast.component.html',
  styleUrls: ['./podcast.component.css'],
})
export class PodcastComponent implements OnInit, OnDestroy {
  isLoading: boolean = true;
  podcastSections: PodcastSection[] = [];

  private destroy$ = new Subject<void>();

  constructor(private podcastService: PodcastService, private router: Router) {}

  ngOnInit(): void {
    this.loadPodcastData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPodcastData(): void {
    this.isLoading = true;

    this.podcastService
      .getPodcastSections()
      .pipe(
        takeUntil(this.destroy$), // Previene memory leak
        finalize(() => (this.isLoading = false)) // Gestisce lo stato di caricamento
      )
      .subscribe({
        next: (sections) => {
          this.podcastSections = sections;
        },
        error: (err) => {
          console.error('Errore nel caricamento delle sezioni podcast:', err);
          this.podcastSections = []; // In caso di errore, imposta un array vuoto
        },
      });
  }

  /**
   * Naviga alla pagina di dettaglio di un singolo episodio.
   * @param episode L'episodio cliccato.
   */
  playPodcast(episode: PodcastEpisode): void {
    // Ora usiamo l'ID numerico dell'episodio
    this.router.navigate(['/podcasts/', episode.id]);
  }

  handleSeasonClick(season: PodcastSeason): void {
    if (season.episodes && season.episodes.length > 0) {
      // Chiama la tua funzione di navigazione esistente
      this.seeAllEpisodes(season.slug);
    }
  }
  /**
   * Naviga alla pagina "Vedi tutto" per una specifica stagione.
   * @param slug Lo slug della stagione.
   */
  seeAllEpisodes(slug: string): void {
    // Assumendo che tu abbia una route come '/podcast/season/:slug'
    this.router.navigate(['/podcast/', slug]);
  }
}
