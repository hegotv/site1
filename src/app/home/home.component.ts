// src/app/home/home.component.ts

import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  HostListener,
  ChangeDetectorRef,
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { combineLatest, Subscription } from 'rxjs';
import { delay, filter } from 'rxjs/operators';

// Componenti e Pipe
import { SliderComponent } from '../slider/slider.component';
import { FooterComponent } from '../footer/footer.component';
import { ViewsFormatPipe } from '../views-format.pipe';
import { FormatDurationPipe } from '../format-duration.pipe';

// Servizi e Interfacce
import { LoginService } from '../service/login.service';
import { VideoService } from '../service/video.service';
import { HomeDataService } from '../service/home-data.service';
import {
  Video,
  Category,
  ApiDataResponse,
  durationToSeconds,
  Macro,
  HomeApiCategory,
} from '../shared/interfaces';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    SliderComponent,
    CommonModule,
    FormatDurationPipe,
    ViewsFormatPipe,
    FooterComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  // --- Proprietà di Stato ---
  isLoading = true;
  isBrowser: boolean;
  isMobile = false;
  isLoggedIn = false; // <-- RIPRISTINATA per il template
  random = 0; // <-- RIPRISTINATA per il template

  // --- Proprietà Dati per il Template ---
  heroVideos: Video[] = [];
  trendingMainVideos: Video[] = [];
  continueWatchingVideos: Video[] = [];
  macrosForDisplay: Macro[] = [];
  allShowsCategories: Category[] = [];

  // --- Proprietà UI ---
  currentHeroIndex = 0;
  continueWatchingTitle = 'Continua a Guardare'; // <-- RIPRISTINATA per il template
  public readonly baseUrl = 'https://hegobck-production.up.railway.app'; // <-- RIPRISTINATA per il template
  private heroInterval: any;
  private subscriptions = new Subscription();

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.checkIfMobile((event.target as Window).innerWidth);
  }

  constructor(
    private router: Router,
    private loginService: LoginService,
    private videoService: VideoService,
    private homeDataService: HomeDataService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.checkIfMobile(window.innerWidth);
    }
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.loginService.isLoggedIn$.subscribe((loggedIn) => {
        this.isLoggedIn = loggedIn;
        if (loggedIn && this.isBrowser) {
          this.loadContinueWatching();
        } else {
          this.continueWatchingVideos = [];
        }
      })
    );

    this.subscriptions.add(
      combineLatest([
        this.homeDataService.getHomeData(),
        this.homeDataService.getMacros(),
      ])
        .pipe(filter(([homeData]) => !!homeData))
        .subscribe(([homeData, macros]) => {
          this.processApiData(
            homeData as ApiDataResponse,
            (macros as Macro[]) || []
          );
          this.isLoading = false;
          this.cdr.detectChanges();
        })
    );
  }

  ngOnDestroy(): void {
    if (this.heroInterval) clearInterval(this.heroInterval);
    this.subscriptions.unsubscribe();
  }

  private processApiData(homeData: ApiDataResponse, macros: Macro[]): void {
    this.heroVideos = homeData.hero_videos || [];
    this.trendingMainVideos = homeData.trending_main_videos || [];
    this.populateSliders(homeData, macros);
    this.startHeroAutoPlay();
  }

  private loadContinueWatching(): void {
    this.subscriptions.add(
      this.videoService.getContinueWatchingVideos().subscribe({
        next: (videos) => {
          this.continueWatchingVideos = videos || [];
        },
      })
    );
  }

  private populateSliders(homeData: ApiDataResponse, macros: Macro[]): void {
    const categoriesByMacro = homeData.categories_by_macro || {};
    const allCategories: Category[] = [];
    const macrosWithContent: Set<string> = new Set();

    for (const macroTitle in categoriesByMacro) {
      const macroGroup = categoriesByMacro[macroTitle];
      const categoriesFromApi: HomeApiCategory[] = macroGroup?.categories || [];

      if (categoriesFromApi.length > 0) {
        macrosWithContent.add(macroTitle);
        const mappedCategories: Category[] = categoriesFromApi.map((cat) => ({
          ...cat,
          description: cat.desc,
          macro: macroTitle,
        }));
        allCategories.push(...mappedCategories);
      }
    }

    this.allShowsCategories = allCategories
      .filter((cat) => cat.videos?.length > 0)
      .sort((a, b) => a.title.localeCompare(b.title));

    this.macrosForDisplay = macros
      .filter((m) => macrosWithContent.has(m.title))
      .sort((a, b) => a.title.localeCompare(b.title));

    // Calcola il numero random dopo che allShowsCategories è stato popolato
    if (this.allShowsCategories.length > 0) {
      this.random = Math.floor(Math.random() * this.allShowsCategories.length);
    }
  }

  // --- Metodi Helper e UI ---

  startHeroAutoPlay(): void {
    if (this.heroInterval) clearInterval(this.heroInterval);
    if (this.isBrowser && !this.isMobile && this.heroVideos.length > 1) {
      this.heroInterval = setInterval(() => {
        this.nextHeroSlide();
        this.cdr.detectChanges();
      }, 5000);
    }
  }

  selectHeroSlide(index: number): void {
    this.currentHeroIndex = index;
    this.startHeroAutoPlay();
  }

  nextHeroSlide(): void {
    this.currentHeroIndex =
      (this.currentHeroIndex + 1) % this.heroVideos.length;
  }

  // Funzione helper per il template
  getVideoDurationSeconds = (video: Video): number =>
    durationToSeconds(video?.duration);

  // --- Metodi di gestione dei click (RIPRISTINATI) ---

  handleVideoClick(video: Video): void {
    this.goToVideo(video.id);
  }

  handleSeasonClick(category: Category): void {
    this.goToSeason(category.slug);
  }

  handleMacroClick(macro: Macro): void {
    this.goToAllShows(macro.title);
  }

  // --- Metodi di Navigazione ---

  goToSeason(slug: string): void {
    if (slug) this.router.navigate(['/season', slug]);
  }

  goToVideo(videoId: string, startTime?: number): void {
    const queryParams: any = { id: videoId };
    if (startTime != null) {
      queryParams.time = startTime;
    }
    this.router.navigate(['/details'], { queryParams });
  }

  goToAllShows(macro?: string): void {
    this.router.navigate(macro ? ['/serie', macro] : ['/serie']);
  }

  private checkIfMobile(width: number): void {
    const wasMobile = this.isMobile;
    this.isMobile = width < 768;
    if (wasMobile !== this.isMobile) {
      this.startHeroAutoPlay();
    }
  }
}
