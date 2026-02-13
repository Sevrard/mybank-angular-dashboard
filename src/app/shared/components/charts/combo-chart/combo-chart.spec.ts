import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComboChart } from './combo-chart';

describe('ComboChart', () => {
  let component: ComboChart;
  let fixture: ComponentFixture<ComboChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComboChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComboChart);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
