import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocufilmComponent } from './docufilm.component';

describe('DocufilmComponent', () => {
  let component: DocufilmComponent;
  let fixture: ComponentFixture<DocufilmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocufilmComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DocufilmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
