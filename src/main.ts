import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// Boot Angular app immediately so data loads right away
bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);

document.addEventListener('keydown', function (e) {
  if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
    e.preventDefault();
  }
});
document.addEventListener('contextmenu', function (e) {
  e.preventDefault();
});
if (
  'mediaDevices' in navigator &&
  'getDisplayMedia' in navigator.mediaDevices
) {
  navigator.mediaDevices.getDisplayMedia = function () {
    alert('La registrazione dello schermo non è consentita.');
    document.body.style.filter = 'brightness(0)'; // Oscura il contenuto
    return Promise.reject(new Error('Screen recording is blocked.'));
  };
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    document.body.style.filter = 'brightness(0)'; // Oscura la pagina
  } else {
    document.body.style.filter = 'none'; // Ripristina la visibilità
  }
});
