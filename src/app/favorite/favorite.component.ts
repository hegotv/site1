import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VideoService } from '../video.service';

@Component({
  selector: 'app-favorite',
  templateUrl: './favorite.component.html',
  styleUrls: ['./favorite.component.css']
})
export class FavoriteComponent implements OnInit{

  constructor(private router:Router, private videoService: VideoService) { }

  items: any = [];

  ngOnInit(): void {
    if (!localStorage.getItem('user')) {
      this.router.navigate(['/login']);
    }

    console.log("FAVORITE, FAVORITE")

    this.videoService.getFavoriteVideos().then((res: any) => {
      this.items = res.data.list;
    }).catch((err: any) => {
      localStorage.removeItem('user');
      this.router.navigate(['/login']);
    });
  }

  goToVideo(id: string) {
    this.router.navigate(['/details'], { queryParams: { "id": id } });
  }
}
