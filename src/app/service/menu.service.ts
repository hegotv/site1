import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs'; // Importa BehaviorSubject e Observable

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  // BehaviorSubject per gestire lo stato di apertura del sidenav
  private _isSidenavOpen = new BehaviorSubject<boolean>(false);
  public isSidenavOpen$: Observable<boolean> =
    this._isSidenavOpen.asObservable();

  constructor() {}

  public open(): void {
    this._isSidenavOpen.next(true);
  }

  public close(): void {
    this._isSidenavOpen.next(false);
  }

  public toggle(): void {
    this._isSidenavOpen.next(!this._isSidenavOpen.value);
  }
}
