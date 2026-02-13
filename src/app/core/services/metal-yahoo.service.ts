import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { UTCTimestamp } from 'lightweight-charts';
import { CandlePoint } from '../models/candle.model';
import { environment } from '../../../environments/environment';


@Injectable({ providedIn: 'root' })
export class MetalYahooService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getHistory(metal: 'silver' | 'platinum'): Observable<CandlePoint[]> {

    const url = this.apiUrl+`/api/market/metal/${metal}?interval=1m&range=1d`;

    return this.http.get<any>(url).pipe(
      map(res => {
        const result = res.chart.result[0];
        const timestamps = result.timestamp;
        const closes = result.indicators.quote[0].close;

        return timestamps
          .map((t: number, i: number) => ({
            time: t as UTCTimestamp,
            value: closes[i],
          }))
          .filter((p: { value: null; }) => p.value != null);
      })
    );
  }
}



