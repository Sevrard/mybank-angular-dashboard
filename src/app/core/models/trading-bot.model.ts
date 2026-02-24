/** Métal tradé par le bot. */
export type BotMetal = 'gold' | 'silver' | 'platinum';

/**
 * Trade fermé (lastClosedTrades dans GET /api/bot/status ou GET /api/bot/history).
 * Le backend peut envoyer les champs en snake_case (entry_price, close_date, etc.) ; le service normalise en camelCase.
 */
export interface BotClosedTrade {
  id: string;
  status: 'CLOSED';
  /** Métal du trade (or, argent, platine). */
  metal?: BotMetal;
  entryPrice: number;
  exitPrice: number;
  investedAmount: number;
  realizedPnl: number;
  openDate: string;
  closeDate: string;
  currentPriceUsdt?: number | null;
  currentPnlPct?: number | null;
  /** Effet de levier du trade (ex. 10 pour 1:10). */
  leverage?: number;
  /** Volume en lots (optionnel). */
  lots?: number | null;
}

/**
 * Trade ouvert (élément de currentOpenTrades dans GET /api/bot/status).
 * Un par métal au plus.
 */
export interface BotOpenTradeItem {
  id: string;
  status: 'OPEN';
  metal: BotMetal;
  entryPrice: number;
  exitPrice: number | null;
  investedAmount: number;
  realizedPnl: number | null;
  openDate: string;
  closeDate: string | null;
  /** Prix actuel pour ce métal au moment du status. */
  currentPriceUsdt: number | null;
  /** PnL % de la position (ex. 0.008 = +0,8 %). */
  currentPnlPct: number | null;
  /** Gain/perte net en € après spread (déjà avec levier). À afficher comme montant principal « Profit / Perte ». */
  currentRealizedPnlEur?: number | null;
  /** Effet de levier du trade (ex. 10 pour 1:10). */
  leverage?: number;
  /** Volume en lots (optionnel). */
  lots?: number | null;
}

/**
 * Trade ouvert en cours (currentOpenTrade, rétrocompat – premier trade affiché).
 */
export interface BotCurrentOpenTrade {
  investedAmount: number;
  entryPrice: number;
  currentPrice?: number;
  unrealizedPnl?: number;
  symbol?: string;
  metal?: BotMetal;
  currentPriceUsdt?: number | null;
  currentPnlPct?: number | null;
}

/**
 * Seuils du bot (config dans GET /api/bot/status).
 * Valeurs en décimales pour les % (ex. 0.005 = 0,5 %).
 */
export interface BotConfigDto {
  takeProfitPct: number;
  stopLossPct: number;
  trailingActivationPct: number;
  trailingDropPct: number;
  spreadPct: number;
  minHoldMinutes: number;
  cooldownMinutes: number;
  /** Profit minimum en € pour vente auto (ex. 3) : dès que le PnL affiché (net du spread) ≥ cette valeur et durée min passée, le bot revend. */
  takeProfitMinEur?: number;
  /** Effet de levier (1 = aucun, 10 = 1:10). Notional = marge × leverage pour le PnL. */
  leverage?: number;
  /** Volume en lots (optionnel). */
  lots?: number | null;
  /** Métaux tradés par le bot (ex. ["gold", "silver", "platinum"]). */
  metals?: BotMetal[];
}

/**
 * Réponse GET /api/bot/status.
 * Le backend envoie config en snake_case ; le service normalise en BotConfigDto (camelCase).
 */
export interface BotStatusResponse {
  running: boolean;
  allocatedAmount: number;
  /** Tous les trades ouverts (un par métal au plus). */
  currentOpenTrades?: BotOpenTradeItem[];
  /** Premier trade ouvert (rétrocompat). */
  currentOpenTrade?: BotCurrentOpenTrade | null;
  lastClosedTrades: BotClosedTrade[];
  /** Seuils du bot (backend peut envoyer snake_case, normalisé côté service). */
  config?: BotConfigDto;
  /** Prix or (rétrocompat), null si pas de position or. */
  currentPriceUsdt?: number | null;
  /** PnL % position or (rétrocompat). */
  currentPnlPct?: number | null;
}
