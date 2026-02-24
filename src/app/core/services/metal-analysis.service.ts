import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { MetalService } from './metal-stream.service';
import type { MetalType } from './metal-stream.service';
import type { CandleOhlc } from '../models/candle.model';
import type {
  TimeSeriesAnalysis,
  ExogenousSignal,
  MetalAnalysisResult,
  CombinedBias,
  BiasApiResponse,
} from '../models/metal-analysis.model';
import { environment } from '../../../environments/environment';

const DEFAULT_SHORT_PERIOD = 10;
/** 20 points pour que 1 mois de chandeliers journaliers (~22 j) suffise (argent/platine). */
const DEFAULT_LONG_PERIOD = 20;
const CYCLE_LOOKBACK = 20;

@Injectable({ providedIn: 'root' })
export class MetalAnalysisService {
  private metalService = inject(MetalService);
  private http = inject(HttpClient);
  private readonly exogenousSignalsUrl = `${environment.apiUrl}/api/market/exogenous-signals`;
  private readonly biasUrl = `${environment.apiUrl}/api/market/bias`;

  /**
   * Analyse des séries temporelles (le passé) :
   * - Moyennes mobiles courtes/longues
   * - Tendance (up/down/sideways) et force
   * - Phase de cycle (creux / milieu / sommet) sur la fourchette récente
   */
  analyzeTimeSeries(
    data: CandleOhlc[],
    shortPeriod = DEFAULT_SHORT_PERIOD,
    longPeriod = DEFAULT_LONG_PERIOD
  ): TimeSeriesAnalysis | null {
    if (!data.length || data.length < longPeriod) return null;

    const closes = data.map(d => d.close);
    const lastClose = closes[closes.length - 1];

    const maShort = this.ma(closes, shortPeriod);
    const maLong = this.ma(closes, longPeriod);

    const trend: TimeSeriesAnalysis['trend'] =
      maShort > maLong * 1.001 ? 'up' : maShort < maLong * 0.999 ? 'down' : 'sideways';

    const diffPct = maLong !== 0 ? (Math.abs(maShort - maLong) / maLong) * 100 : 0;
    const trendStrength = Math.min(100, Math.round(diffPct * 10));

    const cycleCloses = closes.slice(-CYCLE_LOOKBACK);
    const minC = Math.min(...cycleCloses);
    const maxC = Math.max(...cycleCloses);
    const rangePosition = maxC > minC ? (lastClose - minC) / (maxC - minC) : 0.5;

    const cyclePhase: TimeSeriesAnalysis['cyclePhase'] =
      rangePosition < 0.33 ? 'trough' : rangePosition > 0.67 ? 'peak' : 'mid';

    return {
      trend,
      trendStrength,
      maShort,
      maLong,
      cyclePhase,
      rangePosition,
      periodsUsed: data.length,
    };
  }

  private ma(arr: number[], period: number): number {
    if (arr.length < period) return arr[arr.length - 1] ?? 0;
    const slice = arr.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  }

  /**
   * Variables exogènes (le présent) : dollar, banques centrales, inflation.
   * Données en temps réel depuis le backend (GET /api/market/exogenous-signals).
   */
  getExogenousSignals(): Observable<ExogenousSignal[]> {
    return this.http.get<ExogenousSignal[]>(this.exogenousSignalsUrl).pipe(
      catchError(() => of([]))
    );
  }

  /**
   * Combine tendance (série) + exogènes pour produire un biais global.
   */
  private combineBias(
    seriesAnalysis: TimeSeriesAnalysis,
    exogenousSignals: ExogenousSignal[]
  ): CombinedBias {
    let score = 0;
    score += seriesAnalysis.trend === 'up' ? 1 : seriesAnalysis.trend === 'down' ? -1 : 0;
    for (const s of exogenousSignals) {
      score += s.impact === 'bullish' ? 1 : s.impact === 'bearish' ? -1 : 0;
    }
    return score > 0 ? 'bullish' : score < 0 ? 'bearish' : 'neutral';
  }

  /**
   * Biais combiné (passé + présent) calculé côté backend.
   * GET /api/market/bias?metal=gold|silver|platinum
   */
  getBias(metal: MetalType): Observable<BiasApiResponse | null> {
    return this.http.get<BiasApiResponse>(`${this.biasUrl}?metal=${metal}`).pipe(
      catchError(() => of(null))
    );
  }

  /**
   * Analyse complète pour un métal : passé (série temporelle) + présent (exogènes).
   * @deprecated Préférer getBias() qui utilise le backend pour le biais combiné.
   */
  getFullAnalysis(metal: MetalType): Observable<MetalAnalysisResult | null> {
    return this.metalService.getHistory(metal, '1M').pipe(
      switchMap(history => {
        const seriesAnalysis = this.analyzeTimeSeries(history);
        if (!seriesAnalysis) return of(null);
        const lastPrice = history[history.length - 1].close;
        return this.getExogenousSignals().pipe(
          map(signals => {
            const combinedBias = this.combineBias(seriesAnalysis, signals);
            return {
              metal,
              seriesAnalysis,
              exogenousSignals: signals,
              combinedBias,
              lastPrice,
            };
          })
        );
      })
    );
  }
}
