import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { MenuService } from '../menu.service';
import { Router } from '@angular/router';
import { LoginService } from '../login.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  private mService: MenuService;
  opened: boolean = false;

  @ViewChild('main_container') eRef : ElementRef;

  @HostListener('window:scroll', ['$event'])
  checkScroll() {
    if (window.scrollY > 20) {
      this.sticky_class = "main not_sticky";
      this.sticky_class1 = "box-sticky";
    } else {
      this.sticky_class1 = "";
      this.sticky_class = "main";
    }
  }

  @HostListener('document:click', ['$event'])
  clickout(event: MouseEvent) {
    if(!this.eRef.nativeElement.contains(event.target) && this.links_class == "links-opened") {
      this.switch();
    }
  }

  links_class = "links-closed";
  sticky_class1 = "";
  sticky_class = "main"

  isLoggedIn: boolean = false;

  constructor(mService: MenuService, private router: Router, private loginService: LoginService) {
    this.mService = mService;
  }

  ngOnInit(): void {
    if (!localStorage.getItem('user')) {
      this.isLoggedIn = false;
    } else {
      this.isLoggedIn = true;
    }
    this.loginService.isLoggedInEvent.subscribe((res: boolean) => {
      this.isLoggedIn = res;
    });
  }

  switch() {
    this.links_class = this.links_class == "links-opened" ? "links-opened links-closed" : "links-opened";
  }

  open() {
    this.mService.open();
    this.opened = true;
  }
  close() {
    this.mService.close();
    this.opened = false;
  }

  goToHome() {
    this.router.navigate(['/']);
  }
}
