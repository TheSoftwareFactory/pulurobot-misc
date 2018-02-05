import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RobotmapComponent } from './robotmap.component';

describe('RobotmapComponent', () => {
  let component: RobotmapComponent;
  let fixture: ComponentFixture<RobotmapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RobotmapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RobotmapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
