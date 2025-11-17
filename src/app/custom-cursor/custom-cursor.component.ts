import {
  Component,
  ElementRef,
  HostListener,
  Renderer2,
  ViewChild,
  NgZone,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-custom-cursor',
  standalone: true,
  templateUrl: './custom-cursor.component.html',
  styleUrls: ['./custom-cursor.component.scss'],
})
export class CustomCursorComponent {
  @ViewChild('cursor') cursor!: ElementRef<HTMLElement>;
  @ViewChild('dot') dot!: ElementRef<HTMLElement>;
  @ViewChild('circle') circle!: ElementRef<HTMLElement>;

  private mouseX = 0;
  private mouseY = 0;
  private circleX = 0;
  private circleY = 0;

  private readonly interactiveSelectors =
    'a, button, .filter-bar__button, .project-card__link, .menu-toggle, .faq-item__question, .swiper-button-next, .swiper-button-prev, .swiper-pagination-bullet, .nav-links';

  constructor(
    private renderer: Renderer2,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngAfterViewInit(): void {
    // Only run animations in the browser
    if (isPlatformBrowser(this.platformId)) {
      // loop di aggiornamento con requestAnimationFrame
      this.ngZone.runOutsideAngular(() => this.animate());
    }
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (isPlatformBrowser(this.platformId)) {
      if (
        this.cursor &&
        !this.cursor.nativeElement.classList.contains('visible')
      ) {
        this.renderer.addClass(this.cursor.nativeElement, 'visible');
      }

      this.mouseX = event.clientX;
      this.mouseY = event.clientY;

      // dot → segue istantaneamente
      this.renderer.setStyle(
        this.dot.nativeElement,
        'transform',
        `translate(-50%, -50%) translate3d(${this.mouseX}px, ${this.mouseY}px, 0)`
      );

      const target = event.target as HTMLElement;
      if (target.closest(this.interactiveSelectors)) {
        this.renderer.addClass(this.cursor.nativeElement, 'cursor-grow');
      } else {
        this.renderer.removeClass(this.cursor.nativeElement, 'cursor-grow');
      }
    }
  }

  private animate(): void {
    // interpolazione lineare per cerchio
    this.circleX += (this.mouseX - this.circleX) * 0.15;
    this.circleY += (this.mouseY - this.circleY) * 0.15;

    this.renderer.setStyle(
      this.circle.nativeElement,
      'transform',
      `translate(-50%, -50%) translate3d(${this.circleX}px, ${this.circleY}px, 0)`
    );

    requestAnimationFrame(() => this.animate());
  }
}
