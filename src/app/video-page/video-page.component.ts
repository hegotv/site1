import { Component, HostListener, Input, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';

@Component({
  selector: 'app-video-page',
  templateUrl: './video-page.component.html',
  styleUrls: ['./video-page.component.css']
})
export class VideoPageComponent implements OnInit{

  @Input() url: string
  safeUrl: any;
  loading: boolean = true;
  count: number = 0;

  constructor(private sanitizer: DomSanitizer, private router: Router) {}

  ngOnInit(): void {
    this.safeUrlCheck();
    window.addEventListener('popstate', this.onPopState.bind(this));
  }

  @HostListener('window:popstate', ['$event'])
  onPopState(event: PopStateEvent) {
    // Naviga all'interno dell'applicazione Angular (es. HomePage)
    this.router.navigate(['/']);
  }
  
  safeUrlCheck() {
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
  }

  onIframeLoad(): void {
    this.count++;
    if(this.count > 1) {
      this.loading = false;

    }
  }

}
