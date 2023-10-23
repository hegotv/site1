import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VideoService } from '../video.service';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.css']
})
export class DetailsComponent implements OnInit{

  id: string | null = "";
  data: any = {
    title : "",
    description: "",
    category: "",
    duration: "",
  };
  isSaved: boolean = false;
  imgsrc: any = {};
  isLoggedIn: boolean = false;
  url: string;
  more: boolean = false;
  category: string = "";

  constructor(private router: ActivatedRoute, private router1: Router, private videoService:VideoService){
  }
  
  ngOnInit(): void {
    if(!localStorage.getItem('user')){
      this.isLoggedIn = false;
    }else{
      this.isLoggedIn = true;
    }

    this.router.queryParamMap.subscribe(params => {

      this.id = params.get('id');
      this.getVideoWithUrl();
      this.videoService.addView(Number(this.id)).then((res: any) => {});
    });
  }

  getVideoWithUrl() {
    this.videoService.getVideo(Number(this.id)).then((res: any) => {
      this.data = res.data;

      if(res.data.isSaved === 1){
        this.isSaved = true;
      }else if(res.data.isSaved === 2){
        this.isSaved = false;
      }
      this.category = res.data.category;
      this.url = 'https://iframe.mediadelivery.net/embed/' + this.data.libraryID + '/' + this.data.videoID + '?autoplay=true&ngsw-bypass=true';

      this.imgsrc = 'https://hegobck-production.up.railway.app' + this.data.image 
    }).catch((err: any) => {
      localStorage.removeItem('user');
      this.router1.navigate(['/login']);
    });
  }

  getVideoData() {
    this.videoService.getVideo(Number(this.id)).then((res: any) => {
      this.data = res.data;

      if(res.data.isSaved === 1){
        this.isSaved = true;
      }else if(res.data.isSaved === 2){
        this.isSaved = false;
      }
      
    });
  }

  openDescrition() {
    this.more = !this.more;
  }

  playVideo() {
    this.router1.navigate(['/video', this.id]);
  }

  saveVideo() {
    this.videoService.saveVideo(Number(this.id)).then((res: any) => {
      if ( res.data.response === 'ok' ) {
        this.isSaved = true;
        this.data.saveds++;
      }
    });
  }
  
  removeVideo() {
    this.videoService.removeVideo(Number(this.id)).then((res: any) => {
      if ( res.data.response === 'ok' ) {
        this.isSaved = false;
        this.data.saveds--;
      }
    });
  }
}
