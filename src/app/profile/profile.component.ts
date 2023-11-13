import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../login.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  email:string;

  constructor(private router:Router, private loginService:LoginService) {}

  ngOnInit() {
    if (!localStorage.getItem('user')) {
      this.router.navigate(['/login']);
    }
    this.email = this.loginService.user.email;
  }

  out() {
    this.loginService.logout();
    this.router.navigate(['/login']);
  }

}

