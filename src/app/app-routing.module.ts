import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { DetailsComponent } from './details/details.component';
import { LoginComponent } from './login/login.component';
import { RegistrationComponent } from './registration/registration.component';
import { FavoriteComponent } from './favorite/favorite.component';
import { ProfileComponent } from './profile/profile.component';
import { VideoPageComponent } from './video-page/video-page.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { ExternalRedirectComponent } from './external-redirect/external-redirect.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: "home",
    component: HomeComponent
  },
  {
    path: "details",
    component: DetailsComponent
  },
  {
    path: "login",
    component: LoginComponent
  },
  {
    path: "register",
    component: RegistrationComponent
  },
  {
    path: "favorite",
    component: FavoriteComponent
  },
  {
    path: "profile",
    component: ProfileComponent
  },
  {
    path: "video/:id",
    component: VideoPageComponent
  },
  {
    path: 'externalRedirect',
    component: VideoPageComponent,
  },
  { path: '**', pathMatch: 'full',
        component: PageNotFoundComponent },
];
@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
