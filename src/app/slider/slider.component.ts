import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
  HostListener,
  ChangeDetectorRef,
  TemplateRef, // 1. Importa TemplateRef
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
})
export class SliderComponent implements AfterViewInit {
  // 2. Input generici: accetta qualsiasi array e un template
  @Input() items: any[] = [];
  @Input() itemTemplate!: TemplateRef<any>;
  @Input() sectionTitle: string = '';

  // 3. Output per gestire il click dall'esterno
  @Output() slideClick = new EventEmitter<any>();

  @ViewChild('sliderContent') sliderContentRef!: ElementRef<HTMLElement>;

  isScrollable = false;
  isBackDisabled = true;
  isNextDisabled = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    setTimeout(() => this.updateScrollState(), 100);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateScrollState();
  }

  updateScrollState(): void {
    if (!this.sliderContentRef) return;
    const el = this.sliderContentRef.nativeElement;
    this.isScrollable = el.scrollWidth > el.clientWidth;
    this.isBackDisabled = el.scrollLeft < 1;
    this.isNextDisabled = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1;
    this.cdr.detectChanges();
  }

  nextScroll(): void {
    if (this.isNextDisabled) return;
    const el = this.sliderContentRef.nativeElement;
    el.scrollBy({ left: el.clientWidth, behavior: 'smooth' });
  }

  backScroll(): void {
    if (this.isBackDisabled) return;
    const el = this.sliderContentRef.nativeElement;
    el.scrollBy({ left: -el.clientWidth, behavior: 'smooth' });
  }

  // 4. Emette l'evento con l'item cliccato
  onClickSlide(item: any): void {
    this.slideClick.emit(item);
  }

  // 5. Metodo trackBy generico (opzionale ma consigliato)
  trackByItem(index: number, item: any): any {
    return item.id || item.slug || index;
  }
}
