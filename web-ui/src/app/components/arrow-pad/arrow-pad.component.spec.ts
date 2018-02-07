import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ArrowPadComponent } from './arrow-pad.component';

describe('ArrowPadComponent', () => {
  let component: ArrowPadComponent;
  let fixture: ComponentFixture<ArrowPadComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ArrowPadComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ArrowPadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
