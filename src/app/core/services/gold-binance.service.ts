import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { UTCTimestamp } from 'lightweight-charts';
import { CandleOhlc } from '../models/candle.model';
import { environment } from '../../../environments/environment';
import type { TimeframeKey } from './metal-yahoo.service';

const BINANCE_RANGE: Record<TimeframeKey, string> = {
  '1D': '1d',
  '1W': '5d',
  '1M': '1mo',
  '1Y': '1y',
  'ALL': 'max',
};

@Injectable({ providedIn: 'root' })
export class GoldStreamService {
  private http = inject(HttpClient);

  private readonly PROXY_BASE = `${environment.apiUrl}/api/market/binance/gold`;
  private readonly BINANCE_WS = 'wss://stream.binance.com:9443/ws/paxgusdt@kline_1m';

  getHistory(timeframe: TimeframeKey = '1M'): Observable<CandleOhlc[]> {
    const range = BINANCE_RANGE[timeframe] ?? '1mo';
    const url = `${this.PROXY_BASE}?range=${range}`;

    return this.http.get<any[]>(url).pipe(
      map(data =>
        data.map(d => ({
          time: (d[0] / 1000) as UTCTimestamp,
          open: Number(d[1]),
          high: Number(d[2]),
          low: Number(d[3]),
          close: Number(d[4]),
        }))
      )
    );
  }

  connectLive(): WebSocket {
    return new WebSocket(this.BINANCE_WS);
  }
}