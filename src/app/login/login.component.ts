import { Component, OnInit } from '@angular/core';
import { LoginService } from '../login.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup;
  loginError: boolean = false;

  constructor(private loginService: LoginService, private router:Router) { }

  ngOnInit(): void {
    if(localStorage.getItem('user')){
      this.router.navigate(['/']);
    }
    this.loginForm = new FormGroup({
      email: new FormControl(null, [Validators.required]),
      password: new FormControl(null, [Validators.required])
    });
  }

  onSubmit() {
    const email = this.loginForm.value.email;
    const password = this.loginForm.value.password;
    this.loginService.login(email, password).subscribe(
      {
        next: (v: any) => {
          if(v.response==="ok"){
            this.loginService.createUser(email, v.token);
            localStorage.setItem('user', JSON.stringify(this.loginService.user));
            this.router.navigate(['/']);
            this.loginError = false;
            this.loginService.isLoggedInEvent.emit(true);
          }
        },
        complete: () => {
        },
        error: (e) => {
          console.error(e);
          this.loginError = true;
          this.loginService.isLoggedInEvent.emit(false);
        },

      }
    )
  }
}
