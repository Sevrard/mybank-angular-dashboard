/**
 * Résultat de l'analyse des séries temporelles (le passé) :
 * tendance, force, phase de cycle détectée sur l'historique des prix.
 */
export interface TimeSeriesAnalysis {
  /** Direction de la tendance sur la période analysée */
  trend: 'up' | 'down' | 'sideways';
  /** Force de la tendance (0–100), basée sur pente / volatilité */
  trendStrength: number;
  /** Moyenne mobile courte (ex. 10 périodes) au dernier point */
  maShort: number;
  /** Moyenne mobile longue (ex. 30 périodes) au dernier point */
  maLong: number;
  /** Phase dans le cycle récent : creux / milieu / sommet */
  cyclePhase: 'trough' | 'mid' | 'peak';
  /** Position dans la fourchette récente (0 = creux, 1 = sommet) */
  rangePosition: number;
  /** Nombre de périodes utilisées pour l’analyse */
  periodsUsed: number;
}

/**
 * Signal exogène (le présent) : variable externe qui pousse le prix
 * (dollar, banques centrales, taux, etc.).
 */
export interface ExogenousSignal {
  /** Identifiant (ex. 'usd_index', 'fed_rates') */
  name: string;
  /** Libellé affiché */
  label: string;
  /** Valeur actuelle (ex. cours USD, niveau taux) */
  value: number;
  /** Unité d’affichage (ex. '%', '€') */
  unit: string;
  /** Impact attendu sur le métal précieux */
  impact: 'bullish' | 'bearish' | 'neutral';
  /** Courte description (ex. "USD fort → pression à la baisse sur l'or") */
  description: string;
}

/**
 * Biais combiné (série temporelle + exogènes).
 */
export type CombinedBias = 'bullish' | 'bearish' | 'neutral';

/**
 * Résultat complet d’analyse pour un métal : passé (série) + présent (exogènes).
 */
export interface MetalAnalysisResult {
  /** Métal analysé */
  metal: 'gold' | 'silver' | 'platinum';
  /** Analyse du passé (historique des prix) */
  seriesAnalysis: TimeSeriesAnalysis;
  /** Signaux exogènes (dollar, banques centrales, etc.) */
  exogenousSignals: ExogenousSignal[];
  /** Biais combiné : synthèse tendance + exogènes */
  combinedBias: CombinedBias;
  /** Dernier cours utilisé pour l’analyse */
  lastPrice: number;
}

/** Pondération pour le biais combiné (PredictionService). */
export const PREDICTION_WEIGHTS = {
  /** Tendance (série temporelle) */
  TREND: 0.4,
  /** Indice USD */
  USD: 0.3,
  /** Taux Fed */
  FED: 0.2,
  /** Inflation (CPI) */
  INFLATION: 0.1,
} as const;

/** Noms des signaux exogènes attendus par le front pour le biais combiné. */
export const EXPECTED_EXOGENOUS_SIGNAL_NAMES = ['usd_index', 'fed_rates', 'inflation'] as const;

/**
 * Alias possibles pour chaque signal (backend peut envoyer d’autres noms).
 * Permet de reconnaître les signaux même si le backend n’utilise pas exactement usd_index, fed_rates, inflation.
 */
export const EXOGENOUS_SIGNAL_ALIASES: Record<(typeof EXPECTED_EXOGENOUS_SIGNAL_NAMES)[number], readonly string[]> = {
  usd_index: ['usd_index', 'usdIndex', 'usd', 'dxy', 'usd_index_dxy'],
  fed_rates: ['fed_rates', 'fedRates', 'fed', 'taux_fed', 'tauxFed', 'rates'],
  inflation: ['inflation', 'cpi', 'inflation_cpi', 'inflationCpi'],
};

/** Mots-clés dans le label pour identifier un signal si le name ne matche pas (fallback). */
export const EXOGENOUS_SIGNAL_LABEL_HINTS: Record<(typeof EXPECTED_EXOGENOUS_SIGNAL_NAMES)[number], readonly string[]> = {
  usd_index: ['usd', 'dollar', 'dxy'],
  fed_rates: ['fed', 'taux', 'rates'],
  inflation: ['inflation', 'cpi'],
};

/**
 * Résultat du calcul de biais pondéré (40% Tendance, 30% USD, 20% Fed, 10% Inflation).
 */
export interface PredictionResult {
  /** Métal concerné */
  metal: 'gold' | 'silver' | 'platinum';
  /** Score pondéré dans [-1, 1] avant seuillage */
  weightedScore: number;
  /** Biais combiné déduit du score */
  combinedBias: CombinedBias;
  /** Détail des contributions (pour affichage / debug) */
  contributions: {
    trend: number;
    usd: number;
    fed: number;
    inflation: number;
  };
  /** Signaux exogènes attendus mais absents ou mal nommés (debug / affichage) */
  missingSignals: string[];
}

/** Réponse GET /api/market/bias?metal=gold (biais calculé côté backend). */
export interface BiasPastDto {
  trend: string;
  strength_pct: number;
  phase: string;
  ma_short: number;
  ma_long: number;
  score: number;
}

export interface BiasPresentSignalDto {
  name: string;
  label: string;
  value: number | string;
  unit: string;
  impact: 'bullish' | 'bearish' | 'neutral';
  description: string;
}

export interface BiasApiResponse {
  combined_bias: number;
  past: BiasPastDto | null;
  present: BiasPresentSignalDto[];
  present_score: number;
  computed_at: string;
}
