import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { GoldStreamService } from './gold-binance.service';
import { MetalYahooService } from './metal-yahoo.service';
import type { TimeframeKey } from './metal-yahoo.service';
import { CandleOhlc } from '../models/candle.model';

export type MetalType = 'gold' | 'silver' | 'platinum';

export interface MetalQuote {
  price: number;
  trendPercent: number | null;
}

@Injectable({ providedIn: 'root' })
export class MetalService {
  private gold = inject(GoldStreamService);
  private metalYahooService = inject(MetalYahooService);

  /** Dernier cours et variation (1D) pour les cartes. */
  getLatestQuote(metal: MetalType): Observable<MetalQuote> {
    return this.getHistory(metal, '1D').pipe(
      map(data => {
        if (data.length === 0) return { price: 0, trendPercent: null };
        const last = data[data.length - 1];
        const previous = data.length >= 2 ? data[data.length - 2] : null;
        const trendPercent =
          previous != null && previous.close !== 0
            ? ((last.close - previous.close) / previous.close) * 100
            : null;
        return { price: last.close, trendPercent };
      })
    );
  }

  getHistory(metal: MetalType, timeframe: TimeframeKey = '1M'): Observable<CandleOhlc[]> {
    switch (metal) {
      case 'gold':
        return this.gold.getHistory(timeframe);
      case 'silver':
        return this.metalYahooService.getHistory('silver', timeframe);
      case 'platinum':
        return this.metalYahooService.getHistory('platinum', timeframe);
      default:
        return of([]);
    }
  }

  connectLive(metal: MetalType): WebSocket | undefined {
  switch (metal) {
    case 'gold':
      return this.gold.connectLive();
    case 'silver':
      return undefined; 
    default:
      return undefined;
  }
}

}


