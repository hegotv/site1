import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  inject,
  NgZone,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { takeUntil, switchMap, map, catchError, tap } from 'rxjs/operators';
import {
  PodcastService,
  PodcastEpisode,
  PodcastSeason,
} from '../service/podcast.service';

// Interfaccia per tipizzare chiaramente un episodio che include il suo numero
interface NumberedEpisode extends PodcastEpisode {
  number: number;
}

@Component({
  selector: 'app-audio',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './audio.component.html',
  styleUrls: ['./audio.component.css'],
})
export class AudioComponent implements OnInit, OnDestroy {
  @ViewChild('audioPlayer')
  private audioPlayerRef!: ElementRef<HTMLAudioElement>;

  // Servizi
  private podcastService = inject(PodcastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);
  private destroy$ = new Subject<void>();

  // Stato del componente
  isLoading = true;
  episode: PodcastEpisode | null = null;
  episodeNumber: number | null = null;
  errorMessage: string | null = null;
  otherEpisodes: NumberedEpisode[] = [];
  seasonTitle: string | null = null;

  // Stato del player
  isPlaying = false;
  currentTime = 0;
  duration = 0;
  isSeekable = false;

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        tap(() => this.resetPlayerState()),
        map((params) => {
          const id = params.get('id');
          if (!id) throw new Error("ID dell'episodio mancante.");
          return Number(id);
        }),
        switchMap((episodeId) =>
          this.podcastService.getPodcastSections().pipe(
            map((sections) => {
              let foundEpisode: PodcastEpisode | undefined;
              let foundSeason: PodcastSeason | undefined;

              for (const section of sections) {
                for (const season of section.seasons) {
                  foundEpisode = season.episodes.find(
                    (ep) => ep.id === episodeId
                  );
                  if (foundEpisode) {
                    foundSeason = season;
                    break;
                  }
                }
                if (foundSeason) break;
              }

              if (foundEpisode && foundSeason) {
                return { episode: foundEpisode, season: foundSeason };
              } else {
                throw new Error(`Episodio con ID ${episodeId} non trovato.`);
              }
            })
          )
        ),
        catchError((error) => {
          console.error("Errore durante il caricamento dell'episodio:", error);
          this.errorMessage =
            "L'episodio che stai cercando non è stato trovato o non è più disponibile.";
          this.isLoading = false;
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((result) => {
        if (!result) return; // Gestisce il caso di errore in modo pulito

        const { episode, season } = result;
        const episodeIndex = season.episodes.findIndex(
          (ep) => ep.id === episode.id
        );

        this.episode = episode;
        this.seasonTitle = season.title;
        this.episodeNumber = episodeIndex !== -1 ? episodeIndex + 1 : null;

        // Mappa l'intero array di episodi per aggiungere il numero,
        // poi filtra quello corrente per creare la lista degli "altri episodi".
        this.otherEpisodes = season.episodes
          .map(
            (ep, index): NumberedEpisode => ({
              ...ep,
              number: index + 1,
            })
          )
          .filter((ep) => ep.id !== episode.id);

        this.isLoading = false;
        this.setupMediaSession();
        this.cdr.detectChanges();

        this.triggerIOSLoad();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cleanupMediaSession();
  }

  private resetPlayerState(): void {
    this.isLoading = true;
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 0;
    this.isSeekable = false;
    this.episode = null;
    this.episodeNumber = null;
    this.otherEpisodes = [];
    this.seasonTitle = null;
    this.errorMessage = null;
  }

  // --- Metodi del Player ---

  private get audio(): HTMLAudioElement | null {
    return this.audioPlayerRef?.nativeElement ?? null;
  }

  togglePlayPause(): void {
    if (!this.audio || !this.isSeekable) return;
    this.audio.paused ? this.audio.play() : this.audio.pause();
  }

  seekRelative(offset: number): void {
    if (!this.isSeekable || !this.audio) return;
    this.zone.runOutsideAngular(() => {
      const newTime = this.audio!.currentTime + offset;
      this.audio!.currentTime = Math.max(0, Math.min(this.duration, newTime));
    });
  }

  onSeekClick(event: MouseEvent): void {
    if (!this.isSeekable || !this.audio) return;
    this.zone.runOutsideAngular(() => {
      const progressBar = event.currentTarget as HTMLElement;
      const rect = progressBar.getBoundingClientRect();
      const percentage = (event.clientX - rect.left) / rect.width;
      this.audio!.currentTime = this.duration * percentage;
    });
  }

  onCanPlay(): void {
    if (!this.audio) return;
    this.duration = this.audio.duration;
    this.isSeekable = true;
    // Rileva le modifiche perché 'isSeekable' è stato aggiornato
    this.cdr.detectChanges();
  }

  onTimeUpdate(): void {
    if (this.audio) this.currentTime = this.audio.currentTime;
  }

  onPlay(): void {
    this.isPlaying = true;
  }
  onPause(): void {
    this.isPlaying = false;
  }
  onEnded(): void {
    this.isPlaying = false;
    this.currentTime = 0;
  }

  playOtherEpisode(episodeId: number): void {
    this.router.navigate(['/podcasts/', episodeId]);
  }

  private triggerIOSLoad(): void {
    // Usa setTimeout per assicurarti che il DOM sia aggiornato e il tag <audio> esista
    setTimeout(() => {
      if (this.audio) {
        // Forza il ricaricamento della risorsa
        this.audio.load();
        console.log('Audio resource loaded manually for iOS compatibility');
      }
    }, 100);
  }

  // --- Media Session API ---

  private setupMediaSession(): void {
    if (!('mediaSession' in navigator) || !this.episode) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: this.episode.title,
      artist: this.episode.speaker,
      album: this.seasonTitle ?? 'Podcast',
      artwork: [
        {
          src: this.episode.artwork_image,
          sizes: '512x512',
          type: 'image/jpeg',
        },
      ],
    });
    navigator.mediaSession.setActionHandler('play', () =>
      this.togglePlayPause()
    );
    navigator.mediaSession.setActionHandler('pause', () =>
      this.togglePlayPause()
    );
    navigator.mediaSession.setActionHandler('seekforward', () =>
      this.seekRelative(15)
    );
    navigator.mediaSession.setActionHandler('seekbackward', () =>
      this.seekRelative(-15)
    );
  }

  private cleanupMediaSession(): void {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = null;
      ['play', 'pause', 'seekforward', 'seekbackward'].forEach((handler) =>
        navigator.mediaSession.setActionHandler(
          handler as MediaSessionAction,
          null
        )
      );
    }
  }
}
