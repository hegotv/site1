import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-christmas-snow',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="snow-container" aria-hidden="true">
      @for (flake of snowflakes; track $index) {
      <div
        class="snowflake"
        [style.left.%]="flake.left"
        [style.animation-duration.s]="flake.duration"
        [style.animation-delay.s]="flake.delay"
        [style.opacity]="flake.opacity"
        [style.font-size.px]="flake.size"
      >
        ❄
      </div>
      }
    </div>
  `,
  styles: [
    `
      .snow-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none; /* FONDAMENTALE: permette di cliccare attraverso la neve */
        z-index: 9999; /* Sopra a tutto */
        overflow: hidden;
      }

      .snowflake {
        position: absolute;
        top: -20px;
        color: #fff;
        text-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
        animation-name: fall;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
      }

      @keyframes fall {
        0% {
          transform: translateY(-20px) translateX(0) rotate(0deg);
        }
        100% {
          transform: translateY(105vh) translateX(20px) rotate(360deg);
        }
      }
    `,
  ],
})
export class ChristmasSnowComponent implements OnInit {
  // Generiamo 50 fiocchi di neve
  snowflakes: any[] = [];

  ngOnInit() {
    this.snowflakes = Array.from({ length: 10 }, () => ({
      left: Math.random() * 100, // Posizione orizzontale casuale
      duration: Math.random() * 5 + 5, // Durata tra 5s e 10s
      delay: Math.random() * 5, // Ritardo iniziale
      opacity: Math.random() * 0.7 + 0.3, // Opacità variabile
      size: Math.random() * 10 + 10, // Dimensione tra 10px e 20px
    }));
  }
}
