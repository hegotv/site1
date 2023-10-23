import { Injectable } from '@angular/core';
import { MatSidenav } from '@angular/material';
import { EventEmitter } from 'stream';

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  private sidenav!: MatSidenav;

  constructor() { }

  public setSidenav(sidenav: MatSidenav) {
    this.sidenav = sidenav;
  }

  public open(): void {
    this.sidenav.open();
  }
  public close(): void {
    this.sidenav.close();
  }
}
