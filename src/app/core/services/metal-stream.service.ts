
import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { GoldStreamService } from './gold-binance.service';
import { MetalYahooService } from './metal-yahoo.service';
import { CandlePoint } from '../models/candle.model';

export type MetalType = 'gold' | 'silver' | 'platinum';

@Injectable({ providedIn: 'root' })
export class MetalService {
  private gold = inject(GoldStreamService);
  private metalYahooService = inject(MetalYahooService);

  getHistory(metal: MetalType): Observable<CandlePoint[]> {
              console.log("GET SILVER 222");

    switch (metal) {
      case 'gold':
        return this.gold.getHistory();
      case 'silver':
        return this.metalYahooService.getHistory('silver');
      case 'platinum':
        return this.metalYahooService.getHistory('platinum');
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


