import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { LoginService } from '../login.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css']
})
export class RegistrationComponent {

  registrationForm: FormGroup;
  registrationError: boolean = false;

  constructor(private loginService: LoginService, private router: Router) { }
  ngOnInit(): void {
    this.registrationForm = new FormGroup({
      username: new FormControl(null, [Validators.required]),
      email: new FormControl(null, [Validators.required, Validators.email]),
      password: new FormControl(null, [Validators.required])
    });
  }

  onSubmit() {
    const email = this.registrationForm.value.email;
    const username = this.registrationForm.value.username;
    const password = this.registrationForm.value.password;
    this.loginService.signUp(email, username, password).subscribe(
      {
        next: (v: any) => {
          if(v.response==="ok"){
            this.loginService.createUser(email, v.token);
            localStorage.setItem('user', JSON.stringify(this.loginService.user));
            this.registrationError = false;
            this.loginService.isLoggedInEvent.emit(true);
            this.router.navigate(['/']);
          }
        },
        error: (e) => {
          this.registrationError = true;
        },

      }
    )
  }
}
