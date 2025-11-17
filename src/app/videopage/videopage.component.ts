import {
  Component,
  Input,
  Output,
  EventEmitter,
  Inject,
  PLATFORM_ID,
  OnDestroy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

declare const playerjs: any;

@Component({
  selector: 'app-videopage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './videopage.component.html',
  styleUrls: ['./videopage.component.css'],
})
export class VideopageComponent implements OnDestroy {
  safeUrl: SafeResourceUrl | null = null;

  @Input() libraryID?: string; // ID di Bunny
  @Output() timeUpdated = new EventEmitter<{
    seconds: number;
    libraryID: string;
  }>();

  private isBrowser: boolean;
  private player: any;

  @Input()
  set url(value: string | undefined) {
    if (value) {
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(value);
      if (this.isBrowser) {
        setTimeout(() => this.initializePlayer(), 0);
      }
    } else {
      this.safeUrl = null;
    }
  }

  constructor(
    private sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnDestroy(): void {
    if (this.isBrowser && this.player) {
      this.player.off('*');
    }
  }

  private initializePlayer(): void {
    try {
      const iframeElement = document.getElementById('bunny-stream-player');
      if (!iframeElement) {
        console.error('[Player.js] iframe non trovato.');
        return;
      }

      this.player = new playerjs.Player(iframeElement);

      this.player.on('ready', () => {
        this.player.on('timeupdate', (data: { seconds: number }) => {
          if (this.libraryID) {
            this.timeUpdated.emit({
              seconds: data.seconds,
              libraryID: this.libraryID,
            });
          }
        });
      });
    } catch (e) {
      console.error('[Player.js] Errore inizializzazione:', e);
    }
  }
}
