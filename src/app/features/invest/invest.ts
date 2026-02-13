import { Component } from '@angular/core';
import { MetalChartComponent } from '../../shared/components/charts/metal-chart';

@Component({
  selector: 'app-investment',
  templateUrl: './invest.html',
  styleUrls: ['./invest.scss'],
  imports:[MetalChartComponent]
})
export class InvestmentComponent {
  timeframes = ['1D', '1W', '1M', '1Y', 'ALL'];
  activeTf = '1M';

  metals = [
    { name: 'Gold', symbol: 'XAU', price: '4,953.05 €', trend: '+1.42%' },
    { name: 'Silver', symbol: 'XAG', price: '22.18 €', trend: '-0.38%' },
    { name: 'Platinum', symbol: 'XPT', price: '912.40 €', trend: '+0.62%' },
    { name: 'Palladium', symbol: 'XPD', price: '1,024.90 €', trend: '+1.12%' },
  ];

  setTimeframe(tf: string) {
    this.activeTf = tf;
  }
}
