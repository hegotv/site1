import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable, Output } from '@angular/core';
import { User } from './model/user.model';
import axios from 'axios';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  @Output() isLoggedInEvent: EventEmitter<any> = new EventEmitter();

  user: User;
  isLoggedIn: boolean = false;
  constructor(private http: HttpClient) { }

  login(email:string, password:string) {
    return this.http.post('https://hegobck-production.up.railway.app/auth/login/', {"username":email, "password":password});
  }

  createUser(email:string, token:string) {
    this.user = new User(email, token);
    this.isLoggedIn = true;
  }

  logout() {
    axios.post('https://hegobck-production.up.railway.app/auth/logout/',{}, {headers:{'Authorization' : 'Token ' + this.user.token}});
    localStorage.removeItem('user');
    this.isLoggedIn = false;
    this.isLoggedInEvent.emit(false);
  }

  signUp(email:string, username:string, password:string) {
    return this.http.post('https://hegobck-production.up.railway.app/auth/register/', {"email":email, "password":password, "username":username});
  }
}
