import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QRCodeModule } from 'angularx-qrcode';

@Component({
  selector: 'app-qr-code',
  standalone: true,
  imports: [QRCodeModule, CommonModule, FormsModule],
  templateUrl: './qr-code.component.html',
  styleUrl: './qr-code.component.css',
})
export class QrCodeComponent {
  // Dati QR
  public qrData: string = 'https://tuosito.com';
  public colorDark: string = '#000000';
  public colorLight: string = '#ffffff';
  public size: number = 300;

  // Dati Logo
  public logoImage: string | undefined = undefined; // Base64
  public logoObj: HTMLImageElement | undefined = undefined; // Oggetto immagine per calcoli

  public logoPadding: number = 5; // Padding del box bianco
  public logoScale: number = 20;
  public logoBackground: boolean = true;
  /**
   * Gestisce il caricamento del file
   */
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.logoImage = e.target.result;

        // Creiamo un oggetto immagine per leggerne le dimensioni originali
        const img = new Image();
        img.src = this.logoImage as string;
        img.onload = () => {
          this.logoObj = img;
        };
      };
      reader.readAsDataURL(file);
    } else {
      this.logoImage = undefined;
      this.logoObj = undefined;
    }
  }

  /**
   * Scarica il QR Code fondendo il Canvas del QR con l'immagine del Logo
   * in modo proporzionato e con sfondo opzionale.
   */
  downloadQrCode() {
    const qrCanvas = document.querySelector(
      'qrcode canvas'
    ) as HTMLCanvasElement;
    if (!qrCanvas) return;

    const canvas = document.createElement('canvas');
    canvas.width = this.size;
    canvas.height = this.size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Disegna il QR Code completo
    ctx.drawImage(qrCanvas, 0, 0, this.size, this.size);

    if (this.logoImage && this.logoObj) {
      // Calcoli dimensionali
      const maxLogoSize = (this.size * this.logoScale) / 100;
      const ratio = this.logoObj.width / this.logoObj.height;

      let drawWidth = maxLogoSize;
      let drawHeight = maxLogoSize;

      if (ratio > 1) {
        drawHeight = maxLogoSize / ratio;
      } else {
        drawWidth = maxLogoSize * ratio;
      }

      const xPos = (this.size - drawWidth) / 2;
      const yPos = (this.size - drawHeight) / 2;

      // === CORREZIONE CRITICA PER LEGGIBILITÀ ===

      // Calcoliamo un'area leggermente più grande del logo (padding)
      const cleanMargin = 4; // Pixel di spazio extra
      const cleanW = drawWidth + cleanMargin * 2;
      const cleanH = drawHeight + cleanMargin * 2;
      const cleanX = xPos - cleanMargin;
      const cleanY = yPos - cleanMargin;

      // A. Se l'utente vuole il bordo colorato (logoBackground = true)
      if (this.logoBackground) {
        ctx.fillStyle = this.colorLight; // Usa il colore di sfondo del QR
        // Disegna un rettangolo solido che copre i dati del QR
        ctx.fillRect(cleanX, cleanY, cleanW, cleanH);
      } else {
        // B. Se l'utente vuole il logo trasparente, DOBBIAMO comunque rimuovere i puntini sotto
        // altrimenti il logo si mischia ai dati e rompe la scansione.
        // Usiamo fillRect con lo stesso colore dello sfondo globale.
        ctx.fillStyle = this.colorLight;
        ctx.fillRect(xPos, yPos, drawWidth, drawHeight);
      }

      // 2. Disegna il logo sopra l'area pulita
      ctx.drawImage(this.logoObj, xPos, yPos, drawWidth, drawHeight);
    }

    const imageUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `qr-code-${Date.now()}.png`;
    link.click();
  }
}
