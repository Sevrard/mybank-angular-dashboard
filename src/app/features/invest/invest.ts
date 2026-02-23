import { Component, OnInit, inject } from '@angular/core';
import { MetalChartComponent } from '../../shared/components/charts/metal-chart';
import type { TimeframeKey } from '../../core/services/metal-yahoo.service';
import type { ChartType } from '../../shared/components/charts/metal-chart';
import { MetalService, type MetalType, type MetalQuote } from '../../core/services/metal-stream.service';
import { forkJoin } from 'rxjs';

export interface MetalCard {
  id: MetalType;
  name: string;
  symbol: string;
  quote: MetalQuote | null;
}

@Component({
  selector: 'app-investment',
  templateUrl: './invest.html',
  styleUrls: ['./invest.scss'],
  imports: [MetalChartComponent],
})
export class InvestmentComponent implements OnInit {
  private metalService = inject(MetalService);

  timeframes: TimeframeKey[] = ['1D', '1W', '1M', '1Y', 'ALL'];
  activeTf: TimeframeKey = '1D';
  activeChartType: ChartType = 'candle';

  metals: MetalCard[] = [
    { id: 'gold', name: 'Gold', symbol: 'XAU', quote: null },
    { id: 'silver', name: 'Silver', symbol: 'XAG', quote: null },
    { id: 'platinum', name: 'Platinum', symbol: 'XPT', quote: null },
  ];

  loading = true;

  ngOnInit(): void {
    this.loadQuotes();
  }

  private loadQuotes(): void {
    this.loading = true;
    forkJoin({
      gold: this.metalService.getLatestQuote('gold'),
      silver: this.metalService.getLatestQuote('silver'),
      platinum: this.metalService.getLatestQuote('platinum'),
    }).subscribe({
      next: ({ gold, silver, platinum }) => {
        this.metals[0].quote = gold;
        this.metals[1].quote = silver;
        this.metals[2].quote = platinum;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  formatPrice(quote: MetalQuote | null): string {
    if (!quote || quote.price === 0) return '—';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(quote.price) + ' €';
  }

  formatTrend(quote: MetalQuote | null): string | null {
    if (!quote || quote.trendPercent == null) return null;
    const sign = quote.trendPercent >= 0 ? '+' : '';
    return `${sign}${quote.trendPercent.toFixed(2)}%`;
  }

  isTrendPositive(quote: MetalQuote | null): boolean {
    return quote?.trendPercent != null && quote.trendPercent >= 0;
  }

  /** Reçoit le dernier prix émis par un graphique et met à jour la carte correspondante. */
  onQuote(metalId: MetalType, quote: MetalQuote): void {
    this.metals = this.metals.map(m => (m.id === metalId ? { ...m, quote } : m));
  }

  setTimeframe(tf: TimeframeKey): void {
    this.activeTf = tf;
  }

  setChartType(type: ChartType): void {
    this.activeChartType = type;
  }
}
