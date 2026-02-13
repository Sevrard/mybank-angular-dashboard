import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { UTCTimestamp } from 'lightweight-charts';
import { CandlePoint } from '../models/candle.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GoldStreamService {
  private http = inject(HttpClient);
  
private readonly PROXY_URL =`${environment.apiUrl}/api/market/binance/gold`;
private readonly BINANCE_WS = 'wss://stream.binance.com:9443/ws/paxgusdt@kline_1m';

  getHistory(): Observable<CandlePoint[]> {
    return this.http
      .get<any[]>(this.PROXY_URL)
      .pipe(
        map(data =>
          data.map(d => ({
            time: (d[0] / 1000) as UTCTimestamp,
            value: Number(d[4]),
          }))
        )
      );
  }

  connectLive(): WebSocket {
    return new WebSocket(this.BINANCE_WS);
  }
}