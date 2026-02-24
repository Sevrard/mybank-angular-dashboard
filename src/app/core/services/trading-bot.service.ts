import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap, startWith, tap, catchError, of, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { BotStatusResponse, BotConfigDto, BotOpenTradeItem, BotClosedTrade, BotMetal } from '../models/trading-bot.model';

const POLL_INTERVAL_MS = 5000;

/** Normalise config (accepte snake_case du backend). */
function normalizeConfig(raw: unknown): BotConfigDto | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const num = (k: string) => (typeof o[k] === 'number' ? o[k] as number : undefined);
  const takeProfitPct = num('takeProfitPct') ?? num('take_profit_pct');
  const stopLossPct = num('stopLossPct') ?? num('stop_loss_pct');
  const trailingActivationPct = num('trailingActivationPct') ?? num('trailing_activation_pct');
  const trailingDropPct = num('trailingDropPct') ?? num('trailing_drop_pct');
  const spreadPct = num('spreadPct') ?? num('spread_pct');
  const minHoldMinutes = num('minHoldMinutes') ?? num('min_hold_minutes');
  const cooldownMinutes = num('cooldownMinutes') ?? num('cooldown_minutes');
  const takeProfitMinEur = num('takeProfitMinEur') ?? num('take_profit_min_eur');
  const leverage = num('leverage');
  const lotsRaw = o['lots'];
  const lots = lotsRaw === null ? null : (typeof lotsRaw === 'number' ? lotsRaw : (num('lots') ?? null));
  const metalsRaw = o['metals'];
  const metals: BotMetal[] | undefined = Array.isArray(metalsRaw)
    ? (metalsRaw as string[]).filter((m): m is BotMetal => ['gold', 'silver', 'platinum'].includes(m))
    : undefined;

  if ([takeProfitPct, stopLossPct, minHoldMinutes, cooldownMinutes].every(v => v !== undefined)) {
    return {
      takeProfitPct: takeProfitPct ?? 0,
      stopLossPct: stopLossPct ?? 0,
      trailingActivationPct: trailingActivationPct ?? 0,
      trailingDropPct: trailingDropPct ?? 0,
      spreadPct: spreadPct ?? 0,
      minHoldMinutes: minHoldMinutes ?? 0,
      cooldownMinutes: cooldownMinutes ?? 0,
      takeProfitMinEur: takeProfitMinEur,
      leverage: leverage,
      lots: lots ?? null,
      metals: metals?.length ? metals : undefined,
    };
  }
  return undefined;
}

/** Valeur number ou null depuis un objet (camelCase ou snake_case). */
function numFrom(obj: Record<string, unknown>, ...keys: string[]): number | null | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'number') return v;
    if (v === null) return null;
  }
  return undefined;
}

function strFrom(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string') return v;
  }
  return undefined;
}

/** Normalise un trade ouvert (backend peut envoyer snake_case). */
function normalizeOpenTradeItem(raw: unknown): BotOpenTradeItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = strFrom(o, 'id') ?? '';
  const metal = (strFrom(o, 'metal') ?? 'gold') as BotMetal;
  if (!['gold', 'silver', 'platinum'].includes(metal)) return null;
  const entryPrice = numFrom(o, 'entryPrice', 'entry_price') ?? 0;
  const investedAmount = numFrom(o, 'investedAmount', 'invested_amount') ?? 0;
  const openDate = strFrom(o, 'openDate', 'open_date') ?? '';
  const currentPriceUsdt = numFrom(o, 'currentPriceUsdt', 'current_price_usdt');
  const currentPnlPct = numFrom(o, 'currentPnlPct', 'current_pnl_pct');
  const currentRealizedPnlEur = numFrom(o, 'currentRealizedPnlEur', 'current_realized_pnl_eur');
  const leverage = numFrom(o, 'leverage');
  const lots = numFrom(o, 'lots');
  return {
    id,
    status: 'OPEN',
    metal,
    entryPrice,
    exitPrice: numFrom(o, 'exitPrice', 'exit_price') ?? null,
    investedAmount,
    realizedPnl: numFrom(o, 'realizedPnl', 'realized_pnl') ?? null,
    openDate,
    closeDate: strFrom(o, 'closeDate', 'close_date') ?? null,
    currentPriceUsdt: currentPriceUsdt ?? null,
    currentPnlPct: currentPnlPct ?? null,
    currentRealizedPnlEur: currentRealizedPnlEur ?? null,
    leverage: leverage ?? undefined,
    lots: lots ?? null,
  };
}

/** Normalise currentOpenTrades (tableau brut ou snake_case key). */
function normalizeCurrentOpenTrades(res: Record<string, unknown>): BotOpenTradeItem[] | undefined {
  const raw = res['currentOpenTrades'] ?? res['current_open_trades'];
  if (!Array.isArray(raw)) return undefined;
  const out: BotOpenTradeItem[] = [];
  for (const item of raw) {
    const normalized = normalizeOpenTradeItem(item);
    if (normalized) out.push(normalized);
  }
  return out.length ? out : undefined;
}

/** Normalise un trade fermé (backend peut envoyer snake_case). */
function normalizeClosedTrade(raw: unknown): BotClosedTrade | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const metal = (strFrom(o, 'metal') ?? 'gold') as BotMetal;
  if (!['gold', 'silver', 'platinum'].includes(metal)) return null;
  const entryPrice = numFrom(o, 'entryPrice', 'entry_price') ?? 0;
  const exitPrice = numFrom(o, 'exitPrice', 'exit_price') ?? 0;
  const realizedPnl = numFrom(o, 'realizedPnl', 'realized_pnl');
  if (realizedPnl === undefined || realizedPnl === null) return null;
  return {
    id: strFrom(o, 'id') ?? '',
    status: 'CLOSED',
    metal,
    entryPrice,
    exitPrice,
    investedAmount: numFrom(o, 'investedAmount', 'invested_amount') ?? 0,
    realizedPnl,
    openDate: strFrom(o, 'openDate', 'open_date') ?? '',
    closeDate: strFrom(o, 'closeDate', 'close_date') ?? '',
    currentPriceUsdt: numFrom(o, 'currentPriceUsdt', 'current_price_usdt') ?? null,
    currentPnlPct: numFrom(o, 'currentPnlPct', 'current_pnl_pct') ?? null,
    leverage: numFrom(o, 'leverage') ?? undefined,
    lots: numFrom(o, 'lots') ?? null,
  };
}

function normalizeClosedTrades(raw: unknown): BotClosedTrade[] {
  if (!Array.isArray(raw)) return [];
  const out: BotClosedTrade[] = [];
  for (const item of raw) {
    const t = normalizeClosedTrade(item);
    if (t) out.push(t);
  }
  return out;
}

/** Extrait et normalise lastClosedTrades du status (clé lastClosedTrades ou last_closed_trades, items en snake_case). */
function normalizeLastClosedTradesFromResponse(res: Record<string, unknown>): BotClosedTrade[] {
  const raw = res['lastClosedTrades'] ?? res['last_closed_trades'];
  return normalizeClosedTrades(raw);
}

@Injectable({ providedIn: 'root' })
export class TradingBotService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/bot`;

  private statusSignal = signal<BotStatusResponse | null>(null);
  private errorSignal = signal<string | null>(null);
  /** Historique complet des trades fermés (GET /api/bot/history). */
  private closedTradesHistorySignal = signal<BotClosedTrade[]>([]);
  private historyLoadedSignal = signal(false);

  readonly status = this.statusSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  readonly isRunning = computed(() => this.statusSignal()?.running ?? false);
  readonly capitalAllocated = computed(() => this.statusSignal()?.allocatedAmount ?? null);
  /** Tous les trades ouverts (un par métal). Rétrocompat : si pas de currentOpenTrades, dérive d’un seul currentOpenTrade. */
  readonly activePositions = computed((): BotOpenTradeItem[] => {
    const s = this.statusSignal();
    const list = s?.currentOpenTrades;
    if (list?.length) return list;
    const single = s?.currentOpenTrade;
    if (single) {
      const ext = single as BotOpenTradeItem & { unrealizedPnl?: number };
      return [{
        id: (ext as unknown as { id?: string }).id ?? '',
        status: 'OPEN',
        metal: ext.metal ?? 'gold',
        entryPrice: single.entryPrice,
        exitPrice: null,
        investedAmount: single.investedAmount,
        realizedPnl: null,
        openDate: (ext as unknown as { openDate?: string }).openDate ?? '',
        closeDate: null,
        currentPriceUsdt: ext.currentPriceUsdt ?? s?.currentPriceUsdt ?? null,
        currentPnlPct: ext.currentPnlPct ?? s?.currentPnlPct ?? null,
        currentRealizedPnlEur: ext.currentRealizedPnlEur ?? null,
        leverage: ext.leverage,
        lots: ext.lots ?? null,
      }];
    }
    return [];
  });
  /** Premier trade ouvert (rétrocompat). */
  readonly activePosition = computed(() => this.statusSignal()?.currentOpenTrade ?? null);
  /** Derniers trades fermés (lastClosedTrades du status, limité côté backend). */
  readonly lastClosedTrades = computed(() => this.statusSignal()?.lastClosedTrades ?? []);
  /** Historique affiché : tout l'historique si chargé (GET /api/bot/history), sinon lastClosedTrades. */
  readonly displayedClosedTrades = computed((): BotClosedTrade[] =>
    this.historyLoadedSignal() ? this.closedTradesHistorySignal() : this.lastClosedTrades()
  );
  /** Seuils du bot (config du backend), optionnel. */
  readonly config = computed(() => this.statusSignal()?.config ?? null);
  /** Prix actuel vu par le bot (PAXG/USDT), rétrocompat. */
  readonly currentPriceUsdt = computed(() => this.statusSignal()?.currentPriceUsdt ?? null);
  /** PnL % de la position or, rétrocompat. */
  readonly currentPnlPct = computed(() => this.statusSignal()?.currentPnlPct ?? null);

  constructor() {
    const status$ = interval(POLL_INTERVAL_MS).pipe(
      startWith(0),
      switchMap(() => this.http.get<BotStatusResponse>(`${this.baseUrl}/status`))
    );
    status$
      .pipe(
        tap(res => {
          const config = normalizeConfig(res?.config);
          const resRecord = res as unknown as Record<string, unknown>;
          const currentOpenTrades = res ? normalizeCurrentOpenTrades(resRecord) : undefined;
          const lastClosedTrades = res ? normalizeLastClosedTradesFromResponse(resRecord) : [];
          this.statusSignal.set(res ? { ...res, config, ...(currentOpenTrades != null && { currentOpenTrades }), lastClosedTrades } : res);
          this.errorSignal.set(null);
        }),
        catchError(err => {
          this.errorSignal.set(err?.message ?? 'Erreur polling statut');
          return of(this.statusSignal());
        })
      )
      .subscribe();
  }

  /** Liste des métaux supportés (GET /api/bot/available-metals). */
  getAvailableMetals(): Observable<BotMetal[]> {
    const defaultMetals: BotMetal[] = ['gold', 'silver', 'platinum'];
    return this.http.get<BotMetal[]>(`${this.baseUrl}/available-metals`).pipe(
      catchError(() => of(defaultMetals))
    );
  }

  /** Démarre le bot avec le capital (€) et optionnellement métaux, levier et lots. */
  start(
    capitalEur: number,
    metals?: BotMetal[],
    leverage?: number,
    lots?: number | null
  ): Observable<BotStatusResponse | null> {
    this.errorSignal.set(null);
    const body: Record<string, unknown> = { capital: capitalEur };
    if (metals?.length) body['metals'] = metals;
    if (leverage != null && leverage > 0) body['leverage'] = leverage;
    if (lots != null && lots > 0) body['lots'] = lots;
    return this.http.post<BotStatusResponse>(`${this.baseUrl}/start`, body).pipe(
      tap(res => {
        if (res) {
          const resRecord = res as unknown as Record<string, unknown>;
          const config = normalizeConfig(res.config);
          const currentOpenTrades = normalizeCurrentOpenTrades(resRecord);
          const lastClosedTrades = normalizeLastClosedTradesFromResponse(resRecord);
          this.statusSignal.set({ ...res, config, ...(currentOpenTrades != null && { currentOpenTrades }), lastClosedTrades });
        }
      }),
      catchError(err => {
        this.errorSignal.set(err?.message ?? 'Erreur au démarrage du bot');
        return of(null);
      })
    );
  }

  /** Arrête le bot. */
  stop(): Observable<BotStatusResponse | null> {
    this.errorSignal.set(null);
    return this.http.post<BotStatusResponse>(`${this.baseUrl}/stop`, {}).pipe(
      tap(res => {
        if (res) {
          const resRecord = res as unknown as Record<string, unknown>;
          const config = normalizeConfig(res.config);
          const currentOpenTrades = normalizeCurrentOpenTrades(resRecord);
          const lastClosedTrades = normalizeLastClosedTradesFromResponse(resRecord);
          this.statusSignal.set({ ...res, config, ...(currentOpenTrades != null && { currentOpenTrades }), lastClosedTrades });
        }
      }),
      catchError(err => {
        this.errorSignal.set(err?.message ?? 'Erreur à l\'arrêt du bot');
        return of(null);
      })
    );
  }

  /**
   * Vente manuelle d’une position (POST /api/bot/sell).
   * Body : { metal: "gold" | "silver" | "platinum" }.
   * Met à jour le statut et recharge l’historique en cas de succès.
   */
  sellPosition(metal: BotMetal): Observable<BotStatusResponse | null> {
    this.errorSignal.set(null);
    return this.http.post<BotStatusResponse>(`${this.baseUrl}/sell`, { metal }).pipe(
      tap(res => {
        if (res) {
          const resRecord = res as unknown as Record<string, unknown>;
          const config = normalizeConfig(res.config);
          const currentOpenTrades = normalizeCurrentOpenTrades(resRecord);
          const lastClosedTrades = normalizeLastClosedTradesFromResponse(resRecord);
          this.statusSignal.set({ ...res, config, ...(currentOpenTrades != null && { currentOpenTrades }), lastClosedTrades });
          this.loadClosedTradesHistory().subscribe();
        }
      }),
      catchError(err => {
        this.errorSignal.set(err?.message ?? 'Erreur lors de la vente');
        return of(null);
      })
    );
  }

  /**
   * Charge tout l'historique des trades fermés.
   * GET /api/bot/history → réponse { "trades": BotClosedTrade[] } (chaque élément en snake_case, normalisé en camelCase).
   * À appeler au chargement de la page Invest.
   */
  loadClosedTradesHistory(): Observable<BotClosedTrade[]> {
    return this.http.get<{ trades?: unknown[] } | unknown[]>(`${this.baseUrl}/history`).pipe(
      map(raw => normalizeClosedTrades(Array.isArray(raw) ? raw : (raw as { trades?: unknown[] })?.trades ?? [])),
      tap(trades => {
        this.closedTradesHistorySignal.set(trades);
        this.historyLoadedSignal.set(true);
      }),
      catchError(() => {
        // Ne pas set historyLoadedSignal : on garde l’affichage lastClosedTrades en fallback
        return of([]);
      })
    );
  }

  /** Récupère le statut une fois (appel initial ou refresh manuel). */
  fetchStatus(): Observable<BotStatusResponse | null> {
    this.errorSignal.set(null);
    return this.http.get<BotStatusResponse>(`${this.baseUrl}/status`).pipe(
      tap(res => {
        const config = normalizeConfig(res?.config);
        const resRecord = res as unknown as Record<string, unknown>;
        const currentOpenTrades = res ? normalizeCurrentOpenTrades(resRecord) : undefined;
        const lastClosedTrades = res ? normalizeLastClosedTradesFromResponse(resRecord) : [];
        this.statusSignal.set(res ? { ...res, config, ...(currentOpenTrades != null && { currentOpenTrades }), lastClosedTrades } : res);
      }),
      catchError(err => {
        this.errorSignal.set(err?.message ?? 'Erreur de récupération du statut');
        return of(this.statusSignal());
      })
    );
  }
}
