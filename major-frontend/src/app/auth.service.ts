import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public get isLoggedIn(): boolean {
    return Boolean(localStorage.getItem('isLoggedIn'));
  }

  public login(): void {
    localStorage.setItem('isLoggedIn', 'true');
  }

  public logout(): void {
    localStorage.removeItem('isLoggedIn');
  }

  constructor() { }
}
