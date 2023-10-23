import { Component, ElementRef, HostListener, Input, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';


@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.css']
})

export class SliderComponent implements OnInit {

  @ViewChild("slider") slider: ElementRef;
  @ViewChildren("slide") slides : QueryList<any>;

  @Input() items: any;
  @Input() category: any;

  constructor(private router: Router) {

  }

  ngOnInit() {
  }

  ngAfterViewInit(): void {
    // this.slider.nativeElement.querySelector("slider").addEventListener('mousedown', this.nextScroll());
  }

  isDragStart: boolean = false;
  prevPageX = 0;
  prevLeft = 0;

  @HostListener('touchstart', ['$event'])
  ontouch(event: TouchEvent){
    this.dragStartTouch(event);
  }

  // @HostListener('mousedown', ['$event'])
  // onclick(event: MouseEvent){
  //   this.dragStartMouse(event);
  // }


  dragStartTouch(e: TouchEvent) {
    this.isDragStart = true;
    this.slider.nativeElement.style.transition = "";
    if(e.touches === undefined){
        this.prevPageX = 0;
    }else{
        this.prevPageX = e.touches[0].pageX;
    }
    this.prevLeft = parseInt(this.slider.nativeElement.style.left.split("px")[0]);
  }


  dragStartMouse(e: MouseEvent) {
    this.isDragStart = true;
    this.slider.nativeElement.style.transition = "";
    if(e.pageX === undefined){
      this.prevPageX = 0;
    }else{
      this.prevPageX = e.pageX;
    }
    this.prevLeft = parseInt(this.slider.nativeElement.style.left.split("px")[0]);
  }

  // @HostListener('mousemove', ['$event'])
  // onMouseMove(event: MouseEvent){
  //   this.draggingMouse(event);
  // }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent){
    this.draggingTouch(event);
  }

  draggingMouse(e: MouseEvent) {
      if(!this.isDragStart)return;
      e.preventDefault();
      let delta = (e.pageX) - this.prevPageX;
      this.slider.nativeElement.style.left = (this.prevLeft + delta) + "px";
      if(!this.slider.nativeElement.style.left.includes("-")){
        this.slider.nativeElement.style.left = "0px";
      }
      let box = this.slider.nativeElement.children;
      let width = box[0].offsetWidth;
      let imginvie = window.innerWidth/width;
      if(parseInt(this.slider.nativeElement.style.left.split("px")[0])<-((box.length+1)*width)+imginvie*width){
          this.slider.nativeElement.style.left = (-box.length*width + (imginvie-1)*width) + "px";
      }
  }

  draggingTouch(e: TouchEvent) {
    if(!this.isDragStart)return;
    e.preventDefault();
    this.slider.nativeElement.style.transition = "";
    let delta = (e.touches[0].pageX ) - this.prevPageX;
    this.slider.nativeElement.style.left = (this.prevLeft + delta) + "px";
    if(!this.slider.nativeElement.style.left.includes("-")){
        this.slider.nativeElement.style.left = "0px";
    }
    let box = this.slider.nativeElement.children;
    let width = box[0].offsetWidth;
    let imginvie = window.innerWidth/width;
    if(parseInt(this.slider.nativeElement.style.left.split("px")[0])<-((box.length+1)*width)+imginvie*width){
        this.slider.nativeElement.style.left = (-box.length*width + (imginvie-1)*width) + "px";
    }
}

  // @HostListener('mouseup', ['$event'])
  // onMouseUp(){
  //   this.dragStop();
  // }
  // @HostListener('mouseleave', ['$event'])
  // onMouseLeave(){
  //   this.dragStop();
  // }
  @HostListener('touchend', ['$event'])
  onTouchEnd(){
    this.dragStop();
  }

  dragStop() {
      this.isDragStart = false;
      this.slider.nativeElement.style.transition = "all 0.1s ease-in-out";
  }

  nextScroll() {
    var a = parseInt(this.slider.nativeElement.style.left.split("px")[0]);
    var slideWidth = this.slides.first.nativeElement.offsetWidth;
    var imgNumber = window.innerWidth / slideWidth;
    if(-a>((this.slides.length- imgNumber)+1)*slideWidth){
      this.slider.nativeElement.style.left = "0px";
    }else{
      this.slider.nativeElement.style.left = (a - 150) + "px";
    }
  }

  backScroll() {
    var a = parseInt(this.slider.nativeElement.style.left.split("px")[0]);
    var slideWidth = this.slides.first.nativeElement.offsetWidth;
    var imgNumber = window.innerWidth / slideWidth;
    if(a>=0){
      this.slider.nativeElement.style.left = "0px";
    } else {
      this.slider.nativeElement.style.left = (a + 150) + "px";
    }
  }

  goToVideo(id: string) {
    this.router.navigate(['/details'], { queryParams: { "id": id } });
  }
}
