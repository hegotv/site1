import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
  TemplateRef,
  ViewEncapsulation,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-slider',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.css'],
  // Disabilita l'incapsulamento se vuoi che gli stili delle card (definiti qui) si applichino al template proiettato,
  // ALTRIMENTI sposta gli stili .slide-image ecc. nel componente genitore o nel css globale.
  encapsulation: ViewEncapsulation.None,
})
export class SliderComponent implements AfterViewInit, OnDestroy {
  @Input() items: any[] = [];
  @Input() itemTemplate!: TemplateRef<any>;
  @Input() sectionTitle: string = '';

  // Opzionale: permette di nascondere i dots se non desiderati
  @Input() showDots: boolean = true;

  @Output() slideClick = new EventEmitter<any>();

  @ViewChild('sliderContent') sliderContentRef!: ElementRef<HTMLElement>;

  showPrevButton = false;
  showNextButton = true;
  currentSlideIndex = 0;
  isMobile: boolean = window.innerWidth <= 600;
  private resizeObserver: ResizeObserver | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {}

  ngAfterViewInit(): void {
    // Eseguiamo fuori da Angular zone per performance nello scroll, rientriamo solo per aggiornare la UI
    this.ngZone.runOutsideAngular(() => {
      this.initResizeObserver();
      this.addScrollListener();
    });

    // Check iniziale stato pulsanti
    setTimeout(() => this.updateNavigationState(), 100);
  }

  ngOnDestroy(): void {
    this.removeScrollListener();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  /** Performance: TrackBy function per ngFor */
  trackByFn(index: number, item: any): any {
    return item.id || index; // Usa un ID univoco se disponibile, altrimenti index
  }

  private addScrollListener(): void {
    if (this.sliderContentRef) {
      this.sliderContentRef.nativeElement.addEventListener(
        'scroll',
        () => {
          // Debounce visivo semplice o esecuzione diretta
          this.onScroll();
        },
        { passive: true },
      );
    }
  }

  private removeScrollListener(): void {
    if (this.sliderContentRef) {
      // Nota: rimuovere listener anonimi è difficile, qui ci affidiamo al garbage collector
      // distruggendo il riferimento se necessario, ma Angular pulisce i nodi DOM.
    }
  }

  private initResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.ngZone.run(() => {
        this.updateNavigationState();
      });
    });
    if (this.sliderContentRef) {
      this.resizeObserver.observe(this.sliderContentRef.nativeElement);
    }
  }

  private onScroll(): void {
    // Calcoli leggeri
    const el = this.sliderContentRef.nativeElement;

    // Aggiorna logica pulsanti e indice
    // Usiamo requestAnimationFrame per non bloccare il thread principale
    window.requestAnimationFrame(() => {
      this.ngZone.run(() => {
        this.updateNavigationState();
        this.updateCurrentIndex(el);
      });
    });
  }

  private updateNavigationState(): void {
    if (!this.sliderContentRef) return;
    const el = this.sliderContentRef.nativeElement;

    // Tolleranza di 5px per differenze di rendering sub-pixel
    this.showPrevButton = el.scrollLeft > 5;
    this.showNextButton = el.scrollLeft < el.scrollWidth - el.clientWidth - 5;

    this.cdr.markForCheck();
  }

  private updateCurrentIndex(el: HTMLElement): void {
    if (this.items.length === 0) return;

    // Calcoliamo l'indice basandoci sulla larghezza della prima card
    const firstCard = el.firstElementChild as HTMLElement;
    if (!firstCard) return;

    const itemWidth = firstCard.offsetWidth + 24; // 24 è il gap (1.5rem) approssimativo
    this.currentSlideIndex = Math.round(el.scrollLeft / itemWidth);
  }

  scrollLeft(): void {
    const el = this.sliderContentRef.nativeElement;
    const scrollAmount = el.clientWidth * 0.8; // Scorre l'80% della vista
    el.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  }

  scrollRight(): void {
    const el = this.sliderContentRef.nativeElement;
    const scrollAmount = el.clientWidth * 0.8;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }

  scrollToSlide(index: number): void {
    if (!this.sliderContentRef) return;
    const el = this.sliderContentRef.nativeElement;
    const firstCard = el.firstElementChild as HTMLElement;

    if (firstCard) {
      // 1.5rem gap = 24px
      const itemWidth = firstCard.offsetWidth + 24;
      el.scrollTo({ left: index * itemWidth, behavior: 'smooth' });
    }
  }

  onClickSlide(item: any): void {
    this.slideClick.emit(item);
  }
}
