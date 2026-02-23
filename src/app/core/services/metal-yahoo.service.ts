import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { UTCTimestamp } from 'lightweight-charts';
import { CandleOhlc } from '../models/candle.model';
import { environment } from '../../../environments/environment';

export type TimeframeKey = '1D' | '1W' | '1M' | '1Y' | 'ALL';

const YAHOO_RANGE_INTERVAL: Record<TimeframeKey, { range: string; interval: string }> = {
  '1D': { range: '1d', interval: '5m' },
  '1W': { range: '5d', interval: '15m' },
  '1M': { range: '1mo', interval: '1d' },
  '1Y': { range: '1y', interval: '1d' },
  'ALL': { range: 'max', interval: '1wk' },
};

@Injectable({ providedIn: 'root' })
export class MetalYahooService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getHistory(metal: 'silver' | 'platinum', timeframe: TimeframeKey = '1M'): Observable<CandleOhlc[]> {
    const { range, interval } = YAHOO_RANGE_INTERVAL[timeframe] ?? YAHOO_RANGE_INTERVAL['1M'];
    const url = `${this.apiUrl}/api/market/metal/${metal}?interval=${interval}&range=${range}`;

    return this.http.get<any>(url).pipe(
      map(res => {
        const result = res.chart.result[0];
        const timestamps = result.timestamp;
        const quote = result.indicators.quote[0];
        const opens = quote.open ?? quote.close;
        const highs = quote.high ?? quote.close;
        const lows = quote.low ?? quote.close;
        const closes = quote.close;

        return timestamps
          .map((t: number, i: number) => {
            const c = closes[i];
            if (c == null) return null;
            return {
              time: t as UTCTimestamp,
              open: opens[i] ?? c,
              high: highs[i] ?? c,
              low: lows[i] ?? c,
              close: c,
            } as CandleOhlc;
          })
          .filter((p: CandleOhlc | null): p is CandleOhlc => p != null);
      })
    );
  }
}



