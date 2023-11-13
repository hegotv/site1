import { Injectable } from '@angular/core';
import { LoginService } from './login.service';
import axios from 'axios';

@Injectable({
  providedIn: 'root'
})
export class VideoService {

  videos: any = [];
  favoriteVideos: any = [];
  constructor(private loginService: LoginService) {

  }

  getVideos() {
    return axios.post('https://hegobck-production.up.railway.app/video/getVideos/');
  }

  getVideo(id: Number) {
    if(localStorage.getItem('user')){
      return axios.post('https://hegobck-production.up.railway.app/video/getVideo/',{"id": id}, {headers:{'Authorization' : 'Token ' + this.loginService.user.token}});
    }else{
      return axios.post('https://hegobck-production.up.railway.app/video/getVideo/',{"id": id});
    }
  }

  setVideos(videos: any) {
    this.videos = videos;
  }

  getFavoriteVideos() {
    return axios.post('https://hegobck-production.up.railway.app/video/getSavedVideos/',{}, {headers:{'Authorization' : 'Token ' + this.loginService.user.token}});
  }

  addView(id: number) {
    return axios.post('https://hegobck-production.up.railway.app/video/setVisual/',{"id": id});
  }

  saveVideo(id: number) {
    return axios.post('https://hegobck-production.up.railway.app/video/saveVideo/',{"id": id}, {headers:{'Authorization' : 'Token ' + this.loginService.user.token}});
  }
  removeVideo(id: number) {
    return axios.post('https://hegobck-production.up.railway.app/video/deleteSavedVideo/',{"id": id}, {headers:{'Authorization' : 'Token ' + this.loginService.user.token}});
  }
}
