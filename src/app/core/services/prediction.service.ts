import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MetalAnalysisService } from './metal-analysis.service';
import type { MetalType } from './metal-stream.service';
import type { ExogenousSignal } from '../models/metal-analysis.model';
import type { MetalAnalysisResult } from '../models/metal-analysis.model';
import {
  type PredictionResult,
  type CombinedBias,
  PREDICTION_WEIGHTS,
  EXPECTED_EXOGENOUS_SIGNAL_NAMES,
  EXOGENOUS_SIGNAL_ALIASES,
  EXOGENOUS_SIGNAL_LABEL_HINTS,
} from '../models/metal-analysis.model';

/** Seuils pour passer du score pondéré au biais (évite le neutre trop large). */
const BIAS_THRESHOLD = 0.15;

/** Facteur min de la tendance quand trendStrength = 0 ; à 100 on atteint 1. */
const TREND_STRENGTH_MIN_FACTOR = 0.5;

@Injectable({ providedIn: 'root' })
export class PredictionService {
  private analysisService = inject(MetalAnalysisService);

  /**
   * Calcule le Biais Combiné à partir d’une analyse déjà chargée (évite double appel).
   * Pondération : 40% Tendance, 30% USD, 20% Fed, 10% Inflation.
   */
  getPredictionFromAnalysis(full: MetalAnalysisResult): PredictionResult {
    const trendScore = this.trendToWeightedScore(
      full.seriesAnalysis.trend,
      full.seriesAnalysis.trendStrength
    );
    const usd = this.getSignalScoreByKey(full.exogenousSignals, 'usd_index');
    const fed = this.getSignalScoreByKey(full.exogenousSignals, 'fed_rates');
    const inflation = this.getSignalScoreByKey(full.exogenousSignals, 'inflation');

    const missingSignals = EXPECTED_EXOGENOUS_SIGNAL_NAMES.filter(
      key => this.findSignalByKey(full.exogenousSignals, key) == null
    );
    if (missingSignals.length > 0) {
      console.warn(
        `[PredictionService] Signaux exogènes manquants ou mal nommés pour ${full.metal}:`,
        missingSignals,
        '— Reçus:',
        full.exogenousSignals.map(s => s.name)
      );
    }

    const contributions = {
      trend: trendScore * PREDICTION_WEIGHTS.TREND,
      usd: usd * PREDICTION_WEIGHTS.USD,
      fed: fed * PREDICTION_WEIGHTS.FED,
      inflation: inflation * PREDICTION_WEIGHTS.INFLATION,
    };

    const weightedScore =
      contributions.trend + contributions.usd + contributions.fed + contributions.inflation;
    const combinedBias = this.scoreToBias(weightedScore);

    return {
      metal: full.metal,
      weightedScore: Math.round(weightedScore * 100) / 100,
      combinedBias,
      contributions,
      missingSignals: [...missingSignals],
    };
  }

  /**
   * Charge l’analyse puis calcule le Biais Combiné (40% Tendance, 30% USD, 20% Fed, 10% Inflation).
   */
  getPrediction(metal: MetalType): Observable<PredictionResult | null> {
    return this.analysisService.getFullAnalysis(metal).pipe(
      map(full => (full ? this.getPredictionFromAnalysis(full) : null))
    );
  }

  /**
   * Score de tendance pondéré par la force (trendStrength 0–100).
   * Une tendance forte contribue davantage qu’une tendance faible.
   */
  private trendToWeightedScore(trend: 'up' | 'down' | 'sideways', trendStrength: number): number {
    if (trend === 'sideways') return 0;
    const direction = trend === 'up' ? 1 : -1;
    const strengthFactor =
      TREND_STRENGTH_MIN_FACTOR +
      (Math.min(100, Math.max(0, trendStrength)) / 100) * (1 - TREND_STRENGTH_MIN_FACTOR);
    return direction * strengthFactor;
  }

  private impactToScore(impact: ExogenousSignal['impact']): number {
    return impact === 'bullish' ? 1 : impact === 'bearish' ? -1 : 0;
  }

  /**
   * Trouve un signal par nom attendu, par alias, ou par mot-clé dans le label (fallback).
   */
  private findSignalByKey(
    signals: ExogenousSignal[],
    expectedKey: (typeof EXPECTED_EXOGENOUS_SIGNAL_NAMES)[number]
  ): ExogenousSignal | undefined {
    const aliases = EXOGENOUS_SIGNAL_ALIASES[expectedKey];
    const byName = signals.find(s => aliases.includes(s.name));
    if (byName) return byName;
    const hints = EXOGENOUS_SIGNAL_LABEL_HINTS[expectedKey];
    const labelLower = (s: ExogenousSignal) => (s.label ?? '').toLowerCase();
    return signals.find(s => hints.some(h => labelLower(s).includes(h.toLowerCase())));
  }

  private getSignalScoreByKey(
    signals: ExogenousSignal[],
    expectedKey: (typeof EXPECTED_EXOGENOUS_SIGNAL_NAMES)[number]
  ): number {
    const s = this.findSignalByKey(signals, expectedKey);
    return s ? this.impactToScore(s.impact) : 0;
  }

  private scoreToBias(score: number): CombinedBias {
    if (score > BIAS_THRESHOLD) return 'bullish';
    if (score < -BIAS_THRESHOLD) return 'bearish';
    return 'neutral';
  }
}
