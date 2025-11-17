import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { VideopageComponent } from '../videopage/videopage.component';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { VideoService, DetailedVideo } from '../service/video.service'; // Importa DetailedVideo
import { LoginService } from '../service/login.service';

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [VideopageComponent],
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.css'],
})
export class DetailsComponent implements OnInit, OnDestroy {
  id: string | null = null;
  // --- MIGLIORAMENTO: Usa il tipo più specifico `DetailedVideo` ---
  data: DetailedVideo | null = null;
  url: string | undefined;

  isLoggedIn = false;
  // --- MIGLIORAMENTO: Stati di caricamento per le azioni ---
  isSaving = false;
  isRemoving = false;

  private lastKnownTime = 0;
  private readonly isBrowser: boolean;
  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private videoService: VideoService,
    private loginService: LoginService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;

    // Sottoscrizione allo stato di login
    this.subscriptions.add(
      this.loginService.isLoggedIn$.subscribe((loggedIn) => {
        this.isLoggedIn = loggedIn;
      })
    );

    // Dati pre-caricati dal resolver
    this.subscriptions.add(
      this.route.data.subscribe(({ video }) => {
        // La chiave 'video' corrisponde a quella definita nelle rotte.
        if (video) {
          this.processVideoData(video);
        }
      })
    );

    // Event listener per il salvataggio del progresso
    window.addEventListener('beforeunload', this.saveProgressOnEvent);
    document.addEventListener('visibilitychange', this.saveProgressOnEvent);
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      this.saveProgressOnEvent(); // Salva un'ultima volta prima di distruggere il componente
      window.removeEventListener('beforeunload', this.saveProgressOnEvent);
      document.removeEventListener(
        'visibilitychange',
        this.saveProgressOnEvent
      );
      this.subscriptions.unsubscribe();
    }
  }

  /**
   * Centralizza l'elaborazione dei dati del video ricevuti.
   */
  private processVideoData(videoDetails: DetailedVideo): void {
    if (!videoDetails?.libraryID || !videoDetails?.videoID) {
      console.error('Dati video incompleti dal resolver:', videoDetails);
      this.data = null;
      return;
    }

    this.data = videoDetails;
    this.id = this.data.id;

    // Registra la visualizzazione
    if (this.id) {
      this.videoService.addView(this.id).subscribe();
    }

    // Costruisci l'URL dell'iframe
    const startTimeFromUrl = this.route.snapshot.queryParamMap.get('time');
    const effectiveStartTime = startTimeFromUrl
      ? parseFloat(startTimeFromUrl)
      : this.data.last_position_seconds || 0;

    this.url = `https://iframe.mediadelivery.net/embed/${this.data.libraryID}/${
      this.data.videoID
    }?autoplay=true&t=${Math.round(effectiveStartTime)}`;

    this.cdr.detectChanges();
  }

  /**
   * Aggiorna il tempo di riproduzione corrente.
   */
  onTimeUpdate(event: { seconds: number }): void {
    this.lastKnownTime = event.seconds;
  }

  /**
   * Funzione freccia per mantenere il contesto `this` corretto quando usata come event handler.
   */
  private saveProgressOnEvent = (): void => {
    if (
      this.isBrowser &&
      this.isLoggedIn &&
      this.id &&
      this.lastKnownTime > 0
    ) {
      this.videoService.saveVideoProgressOnUnload(this.id, this.lastKnownTime);
      // Resetta il tempo per evitare salvataggi multipli non necessari
      this.lastKnownTime = 0;
    }
  };

  /**
   * Salva il video nei preferiti.
   */
  saveVideo(): void {
    if (!this.id || this.isSaving) return;

    this.isSaving = true;
    // --- CORREZIONE: Rimosso il secondo argomento `'video'` ---
    this.videoService.saveVideo(this.id).subscribe({
      next: () => {
        if (this.data) {
          this.data.isSaved = true;
          this.data.saveds++;
          this.cdr.detectChanges();
        }
      },
      error: (err) =>
        console.error('Errore durante il salvataggio del video:', err),
      complete: () => (this.isSaving = false),
    });
  }

  /**
   * Rimuove il video dai preferiti.
   */
  removeVideo(): void {
    if (!this.id || this.isRemoving) return;

    this.isRemoving = true;
    // --- CORREZIONE: Rimosso il secondo argomento `'video'` ---
    this.videoService.removeVideo(this.id).subscribe({
      next: () => {
        if (this.data) {
          this.data.isSaved = false;
          this.data.saveds--;
          this.cdr.detectChanges();
        }
      },
      error: (err) =>
        console.error('Errore durante la rimozione del video:', err),
      complete: () => (this.isRemoving = false),
    });
  }
}
