import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  inject,
  NgZone,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  PLATFORM_ID,
  afterNextRender,
} from '@angular/core';
import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of, timer } from 'rxjs';
import {
  takeUntil,
  switchMap,
  map,
  catchError,
  tap,
  delay,
} from 'rxjs/operators';
import {
  PodcastService,
  PodcastEpisode,
  PodcastSeason,
} from '../service/podcast.service';

interface NumberedEpisode extends PodcastEpisode {
  number: number;
}

@Component({
  selector: 'app-audio',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './audio.component.html',
  styleUrls: ['./audio.component.css'],
  // OnPush è fondamentale per le performance di un player audio
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AudioComponent implements OnInit, OnDestroy {
  @ViewChild('audioPlayer')
  private audioPlayerRef!: ElementRef<HTMLAudioElement>;

  // Dependency Injection
  private podcastService = inject(PodcastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);

  private destroy$ = new Subject<void>();
  private loadTimeoutId: any;
  private isBrowser = isPlatformBrowser(this.platformId);

  // State
  isLoading = true;
  errorMessage: string | null = null;

  episode: PodcastEpisode | null = null;
  episodeNumber: number | null = null;
  seasonTitle: string | null = null;
  otherEpisodes: NumberedEpisode[] = [];

  // Player State
  isPlaying = false;
  currentTime = 0;
  duration = 0;
  isSeekable = false;
  isDragging = false; // Per gestire lo scrubbing manuale

  constructor() {
    // Esempio: Se usi Angular 16+, potresti usare afterNextRender per logica puramente browser
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        tap(() => this.resetPlayerState()),
        map((params) => {
          const id = params.get('id');
          if (!id) throw new Error("ID dell'episodio mancante.");
          return Number(id);
        }),
        switchMap((episodeId) => this.loadEpisodeData(episodeId)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (result) => {
          if (!result) return;
          this.initializeEpisode(result.episode, result.season);
        },
        error: (err) => this.handleError(err),
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.loadTimeoutId);
    this.cleanupMediaSession();
  }

  // --- Data Loading Logic ---

  private loadEpisodeData(episodeId: number) {
    return this.podcastService.getPodcastSections().pipe(
      map((sections) => {
        for (const section of sections) {
          for (const season of section.seasons) {
            const foundEpisode = season.episodes.find(
              (ep) => ep.id === episodeId
            );
            if (foundEpisode) {
              return { episode: foundEpisode, season: season };
            }
          }
        }
        throw new Error(`Episodio ${episodeId} non trovato.`);
      }),
      catchError((error) => {
        console.error('Load Error:', error);
        this.errorMessage = "Impossibile caricare l'episodio richiesto.";
        this.isLoading = false;
        this.cdr.markForCheck();
        return of(null);
      })
    );
  }
  private initializeEpisode(episode: PodcastEpisode, season: PodcastSeason) {
    const index = season.episodes.findIndex((ep) => ep.id === episode.id);

    this.episode = episode;
    this.seasonTitle = season.title;
    this.episodeNumber = index !== -1 ? index + 1 : null;

    this.otherEpisodes = season.episodes
      .map((ep, i) => ({ ...ep, number: i + 1 }))
      .filter((ep) => ep.id !== episode.id);

    this.isLoading = false;
    this.cdr.markForCheck();

    // Setup Browser specific features
    if (this.isBrowser) {
      this.setupMediaSession();
      this.triggerIOSLoad();
    }
  }
  formatDuration(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '00:00';

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const mStr = m < 10 ? '0' + m : m;
    const sStr = s < 10 ? '0' + s : s;

    // Se c'è almeno un'ora, mostra h:mm:ss, altrimenti mm:ss
    if (h > 0) {
      return `${h}:${mStr}:${sStr}`;
    }
    return `${mStr}:${sStr}`;
  }

  private resetPlayerState(): void {
    this.isLoading = true;
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 0;
    this.isSeekable = false;
    this.errorMessage = null;
    this.cdr.markForCheck();
  }

  private handleError(err: any): void {
    this.errorMessage = 'Si è verificato un errore imprevisto.';
    this.isLoading = false;
    this.cdr.markForCheck();
  }

  // --- Player Actions ---

  private get audio(): HTMLAudioElement | null {
    return this.audioPlayerRef?.nativeElement ?? null;
  }

  togglePlayPause(): void {
    if (!this.audio || !this.isSeekable) return;

    if (this.audio.paused) {
      this.audio.play().catch((e) => console.warn('Autoplay prevented', e));
    } else {
      this.audio.pause();
    }
  }

  seekRelative(offset: number): void {
    if (!this.isSeekable || !this.audio) return;
    const newTime = Math.max(
      0,
      Math.min(this.duration, this.audio.currentTime + offset)
    );
    this.audio.currentTime = newTime;
  }

  // Gestione click sulla barra
  onSeek(event: MouseEvent | TouchEvent): void {
    if (!this.isSeekable || !this.audio) return;

    // Calcolo della posizione indipendente dall'evento (Mouse o Touch)
    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const clientX =
      event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;

    // Clamp tra 0 e 1
    const percentage = Math.max(
      0,
      Math.min(1, (clientX - rect.left) / rect.width)
    );
    const newTime = this.duration * percentage;

    // Se è solo un click, aggiorna subito l'audio.
    // Se stiamo trascinando (implementazione futura), aggiorneremmo solo la UI fino al rilascio.
    this.audio.currentTime = newTime;
  }

  // --- Audio Event Bindings ---

  onCanPlay(): void {
    if (!this.audio) return;
    this.duration = this.audio.duration;
    this.isSeekable = true;
    this.cdr.markForCheck();
  }

  onTimeUpdate(): void {
    // Non aggiornare la UI se l'utente sta trascinando la barra (evita glitch visivi)
    if (this.audio && !this.isDragging) {
      this.currentTime = this.audio.currentTime;
      this.cdr.markForCheck(); // Necessario con OnPush
    }
  }

  onPlay(): void {
    this.isPlaying = true;
    this.cdr.markForCheck();
  }

  onPause(): void {
    this.isPlaying = false;
    this.cdr.markForCheck();
  }

  onEnded(): void {
    this.isPlaying = false;
    this.currentTime = 0;
    this.cdr.markForCheck();
  }

  playOtherEpisode(episodeId: number): void {
    this.router.navigate(['/podcasts/', episodeId]);
  }

  // Gestione tastiera per accessibilità sulla lista episodi
  onEpisodeKeydown(event: KeyboardEvent, episodeId: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.playOtherEpisode(episodeId);
    }
  }

  // --- Browser Specific & Media Session ---

  private triggerIOSLoad(): void {
    // Usiamo ngZone.runOutsideAngular se volessimo evitare check,
    // ma qui un timeout per il rendering DOM è ok.
    this.loadTimeoutId = setTimeout(() => {
      if (this.audio) {
        this.audio.load();
      }
    }, 100);
  }

  private setupMediaSession(): void {
    if (!this.isBrowser || !('mediaSession' in navigator) || !this.episode)
      return;

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

    const actionHandlers = [
      ['play', () => this.togglePlayPause()],
      ['pause', () => this.togglePlayPause()],
      ['seekforward', () => this.seekRelative(15)],
      ['seekbackward', () => this.seekRelative(-15)],
    ] as const;

    actionHandlers.forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (e) {
        console.warn(`MediaSession action ${action} not supported`);
      }
    });
  }

  private cleanupMediaSession(): void {
    if (this.isBrowser && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
    }
  }
}
