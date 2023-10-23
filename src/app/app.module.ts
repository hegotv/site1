import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SliderComponent } from './slider/slider.component';
import { HeaderComponent } from './header/header.component';
import { BannerSliderComponent } from './banner-slider/banner-slider.component';
import {MatSidenavModule} from '@angular/material/sidenav';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HomeComponent } from './home/home.component';
import { SidenavComponent } from './sidenav/sidenav.component';
import { NgImageSliderModule } from 'ng-image-slider';
import { DetailsComponent } from './details/details.component';
import { LoginComponent } from './login/login.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { RegistrationComponent } from './registration/registration.component';
import { FavoriteComponent } from './favorite/favorite.component';
import { ProfileComponent } from './profile/profile.component';
import { VideoPageComponent } from './video-page/video-page.component';
import { OverlayComponent } from './overlay/overlay.component';
import { SafePipe } from './sanitizer';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { ExternalRedirectComponent } from './external-redirect/external-redirect.component';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { FooterComponent } from './footer/footer.component';


@NgModule({
  declarations: [
    AppComponent,
    SliderComponent,
    HeaderComponent,
    BannerSliderComponent,
    HomeComponent,
    SidenavComponent,
    DetailsComponent,
    LoginComponent,
    RegistrationComponent,
    FavoriteComponent,
    ProfileComponent,
    SafePipe,
    VideoPageComponent,
    OverlayComponent,
    PageNotFoundComponent,
    ExternalRedirectComponent,
    FooterComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ReactiveFormsModule ,
    AppRoutingModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    NgImageSliderModule,
    HttpClientModule
  ],
  providers: [
    { provide: LocationStrategy, useClass: HashLocationStrategy }
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
