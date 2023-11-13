import { Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';

@Component({
  selector: 'app-banner-slider',
  templateUrl: './banner-slider.component.html',
  styleUrls: ['./banner-slider.component.css']
})
export class BannerSliderComponent implements OnInit {

  ngOnInit(): void {
  }

  @ViewChild("slider") slider: ElementRef;
  @ViewChildren("slide") slides : QueryList<any>;
  slideWidth: 100;
  currentIndex: number = 0;
  constructor() { }

  ngAfterViewInit(): void {
    this.slider.nativeElement.addEventListener('mousedown', this.nextScroll.bind(this));
  }  

  items = {
    "videos" : [
      {
        "title" : "Titolo",
        "desc" : "Descrizione del video",
        "image":"https://picsum.photos/801/400",
        "category" : "Categoria",
        "duarata" : "1h 40m",
        "like" : "100",
        "views" : "10000"
      },
      {
        "title" : "La ruota delle meraviglie",
        "desc" : "Coney Island anni 50. Ginny, ex attrice che lavora come cameriera, e suo marito Humpty, manovratore di giostre,...",
        "image":"https://picsum.photos/802/400",
        "category" : "Categoria",
        "duarata" : "1h 40m",
        "like" : "100",
        "views" : "10000"
      },
      {
        "title" : "Titolo",
        "desc" : "Descrizione del video wubdiwuedb weuifwueifewifbe eifuweufbweifubwef weifuwebfuwebfweif",
        "image":"https://picsum.photos/803/400",
        "category" : "Categoria",
        "duarata" : "1h 40m",
        "like" : "100",
        "views" : "10000"
      },
      {
        "title" : "Titolo",
        "desc" : "Descrizione del video",
        "image":"https://picsum.photos/804/400",
        "category" : "Categoria",
        "duarata" : "1h 40m",
        "like" : "100",
        "views" : "10000"
      }
    ]
  }

  index: number = 0;

  backScroll() {
    var a = parseInt(this.slider.nativeElement.style.left.split("px")[0]);
    var slideWidth = this.slides.first.nativeElement.offsetWidth;
    if(this.index === 0) return;
    this.index-=1;
    this.slider.nativeElement.style.left = -(this.index*(slideWidth+20)) + "px";
  }

  nextScroll() {
    var a = parseInt(this.slider.nativeElement.style.left.split("px")[0]);
    var slideWidth = this.slides.first.nativeElement.offsetWidth;
    if(this.index >= this.items['videos'].length-1) return;
    this.index += 1;
    this.slider.nativeElement.style.left = -(this.index*(slideWidth+20)) + "px";
  }
}
