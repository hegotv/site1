import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-external-redirect',
  templateUrl: './external-redirect.component.html',
  styleUrls: ['./external-redirect.component.css']
})

export class ExternalRedirectComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
  }
}
