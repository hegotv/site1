import { AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import { MenuService } from './menu.service';
import { MatSidenav } from '@angular/material/sidenav';
import { LoginService } from './login.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit, OnInit {

  @ViewChild("drawer") public sidenav!: MatSidenav;
  mService: MenuService;

  constructor(mService: MenuService, private loginService: LoginService) {
    this.mService = mService;
  }
  ngOnInit(): void {
    if(localStorage.getItem('user')) {
      const user = JSON.parse(localStorage.getItem('user')!);
      this.loginService.createUser(user.email, user.token);
    }
  }

  ngAfterViewInit() {
    this.mService.setSidenav(this.sidenav);
  }

}
