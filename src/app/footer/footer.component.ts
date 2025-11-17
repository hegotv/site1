// footer.component.ts
import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
})
export class FooterComponent implements OnInit {
  showScrollButton: boolean = false;
  private scrollOffset: number = 200; // Mostra il pulsante dopo 200px di scroll

  constructor() {}

  ngOnInit(): void {}

  // Ascolta l'evento di scroll della finestra
  @HostListener('window:scroll', [])
  onWindowScroll() {
    // Controlla la posizione dello scroll verticale
    const yOffset =
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    if (yOffset > this.scrollOffset) {
      this.showScrollButton = true;
    } else {
      this.showScrollButton = false;
    }
  }

  // Funzione per tornare in cima alla pagina con uno scroll fluido
  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth', // Effetto di scroll fluido
    });
  }
}
