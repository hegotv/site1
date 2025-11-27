import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hego.podcast', // Assicurati che sia lo stesso usato nell'init
  appName: 'HegoTv',
  webDir: 'dist/hego_front-main/browser', // Verifica nel tuo angular.json se l'outputPath è 'dist' o 'dist/nome-progetto'
  backgroundColor: '#000000', // Sfondo nero (evita flash bianchi)
  ios: {
    contentInset: 'always', // Gestisce la tacca (Notch)
    allowsLinkPreview: false, // Disabilita preview 3D touch
    scrollEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#000000',
      showSpinner: false, // Molto più elegante senza spinner
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      overlaysWebView: true, // La barra trasparente sopra l'app
    },
  },
};

export default config;
