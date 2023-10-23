import { Component, OnInit } from '@angular/core';
import { LoginService } from "../login.service";

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
  isLoggedIn: boolean;

  constructor(private loginService: LoginService) {}

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
}
