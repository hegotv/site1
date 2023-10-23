import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { LoginService } from "../login.service";
import { VideoService } from "../video.service";


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  categories:any = [];
  items:any = [];

  constructor(private router:Router, private loginService: LoginService, private videoService: VideoService) { }

  ngOnInit(): void {
    this.videoService.getVideos().then((res: any) => {
      this.categories = Object.keys(res.data.list);
      this.items = res.data.list;
      this.videoService.setVideos(this.items);
    });

  }
}
