import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PolarChart } from './polar-chart';

describe('PolarChart', () => {
  let component: PolarChart;
  let fixture: ComponentFixture<PolarChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PolarChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PolarChart);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
