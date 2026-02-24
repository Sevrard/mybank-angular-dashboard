import { Component, OnInit, OnDestroy, inject, signal, effect } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MetalChartComponent } from '../../shared/components/charts/metal-chart';
import type { TimeframeKey } from '../../core/services/metal-yahoo.service';
import type { ChartType } from '../../shared/components/charts/metal-chart';
import { MetalService, type MetalType, type MetalQuote } from '../../core/services/metal-stream.service';
import { MetalAnalysisService } from '../../core/services/metal-analysis.service';
import { TradingBotService } from '../../core/services/trading-bot.service';
import type { BiasApiResponse, BiasPresentSignalDto } from '../../core/models/metal-analysis.model';
import type { BotConfigDto, BotCurrentOpenTrade, BotOpenTradeItem, BotMetal } from '../../core/models/trading-bot.model';
import { forkJoin, interval, switchMap, startWith } from 'rxjs';

export interface MetalCard {
  id: MetalType;
  name: string;
  symbol: string;
  quote: MetalQuote | null;
}

@Component({
  selector: 'app-investment',
  templateUrl: './invest.html',
  styleUrls: ['./invest.scss'],
  imports: [
    DecimalPipe,
    DatePipe,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSelectModule,
    MetalChartComponent,
  ],
})
export class InvestmentComponent implements OnInit, OnDestroy {
  private metalService = inject(MetalService);
  private analysisService = inject(MetalAnalysisService);
  bot = inject(TradingBotService);

  /** Prix or pour le PnL du bot (même source que les cartes). Mis à jour toutes les 5 s. */
  currentGoldPrice = signal<number | null>(null);
  private goldSubscription: { unsubscribe: () => void } | null = null;

  capitalAllocate = 1000;
  configExpanded = false;

  /** Métaux supportés (rempli par GET /api/bot/available-metals, défaut affiché tant que non chargé). */
  availableMetals: BotMetal[] = ['gold', 'silver', 'platinum'];
  /** Métaux sélectionnés pour le prochain démarrage (checkboxes). */
  selectedMetals: BotMetal[] = ['gold', 'silver', 'platinum'];
  /** Options de levier pour le formulaire de démarrage. */
  leverageOptions = [1, 5, 10, 20, 50, 100];
  selectedLeverage = 10;
  /** Options de lots (optionnel). null = pas de lots. */
  lotsOptions: (number | null)[] = [null, 0.01, 0.1, 1];
  selectedLots: number | null = null;
  private hasInitializedSelectedFromConfig = false;

  constructor() {
    effect(() => {
      const cfg = this.bot.config();
      if (!this.hasInitializedSelectedFromConfig && cfg) {
        if (cfg.metals?.length) this.selectedMetals = [...cfg.metals];
        if (cfg.leverage != null && cfg.leverage > 0) this.selectedLeverage = cfg.leverage;
        if (cfg.lots !== undefined && cfg.lots !== null) this.selectedLots = cfg.lots;
        this.hasInitializedSelectedFromConfig = true;
      }
    });
  }

  timeframes: TimeframeKey[] = ['1D', '1W', '1M', '1Y', 'ALL'];
  activeTf: TimeframeKey = '1D';
  activeChartType: ChartType = 'candle';

  /** Biais par métal (GET /api/market/bias?metal=…) – tout calcul côté backend. */
  biasByMetal: Record<MetalType, BiasApiResponse | null> = {
    gold: null,
    silver: null,
    platinum: null,
  };
  analysisLoading = false;
  /** True si le chargement de l’analyse a échoué (réseau / backend) */
  analysisError = false;
  /** Déroulant « passé + présent » par métal */
  expandedByMetal: Record<MetalType, boolean> = {
    gold: false,
    silver: false,
    platinum: false,
  };

  metals: MetalCard[] = [
    { id: 'gold', name: 'Gold', symbol: 'XAU', quote: null },
    { id: 'silver', name: 'Silver', symbol: 'XAG', quote: null },
    { id: 'platinum', name: 'Platinum', symbol: 'XPT', quote: null },
  ];

  loading = true;

  ngOnInit(): void {
    this.loadQuotes();
    this.loadBias();
    this.bot.getAvailableMetals().subscribe(m => {
      this.availableMetals = Array.isArray(m) && m.length > 0 ? m : ['gold', 'silver', 'platinum'];
    });
    this.bot.loadClosedTradesHistory().subscribe();
    this.goldSubscription = interval(5000)
      .pipe(startWith(0), switchMap(() => this.metalService.getLatestQuote('gold')))
      .subscribe(q => this.currentGoldPrice.set(q.price > 0 ? q.price : null));
  }

  ngOnDestroy(): void {
    this.goldSubscription?.unsubscribe();
  }

  /** Libellé métal pour le bot (Or, Argent, Platine). */
  metalLabel(metal: BotMetal): string {
    return metal === 'gold' ? 'Or' : metal === 'silver' ? 'Argent' : 'Platine';
  }

  /** Libellé levier (ex. "Levier 1:10"). */
  formatLeverageLabel(leverage: number): string {
    return `Levier 1:${leverage}`;
  }

  /** Libellé lots (ex. "0,1 lot") ou "—" si null. */
  formatLotsLabel(lots: number | null | undefined): string {
    if (lots == null) return '—';
    return `${lots.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} lot`;
  }

  /** PnL € pour un trade ouvert : priorité à currentRealizedPnlEur (net spread, déjà avec levier). */
  getDisplayedPnlForOpen(pos: BotOpenTradeItem): number | null {
    if (pos.currentRealizedPnlEur != null) return pos.currentRealizedPnlEur;
    if (pos.currentPnlPct != null) return pos.investedAmount * pos.currentPnlPct;
    return null;
  }

  /** Libellé Profit/Perte en € pour un trade ouvert. */
  getDisplayedPnlLabelForOpen(pos: BotOpenTradeItem): string {
    const pnl = this.getDisplayedPnlForOpen(pos);
    if (pnl === null) return '—';
    const sign = pnl >= 0 ? '+' : '';
    return `${sign}${pnl.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  }

  /** PnL % pour un trade ouvert (ex. "+0,84 %"). */
  getDisplayedPnlPctLabelForOpen(pos: BotOpenTradeItem): string {
    if (pos.currentPnlPct == null) return '—';
    return this.formatPnlPct(pos.currentPnlPct);
  }

  /** PnL € affiché (rétrocompat, position unique). */
  getDisplayedPnl(pos: BotCurrentOpenTrade): number | null {
    const pct = this.bot.currentPnlPct();
    if (pct != null) return pos.investedAmount * pct;
    const gold = this.currentGoldPrice();
    if (gold != null && gold > 0 && pos.entryPrice > 0) {
      return pos.investedAmount * (gold / pos.entryPrice - 1);
    }
    return pos.unrealizedPnl ?? null;
  }

  /** Libellé Profit/Perte en € (rétrocompat). */
  getDisplayedPnlLabel(pos: BotCurrentOpenTrade): string {
    const pnl = this.getDisplayedPnl(pos);
    if (pnl === null) return '—';
    const sign = pnl >= 0 ? '+' : '';
    return `${sign}${pnl.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  }

  /** PnL % depuis le backend (rétrocompat). */
  getDisplayedPnlPctLabel(): string {
    const pct = this.bot.currentPnlPct();
    if (pct == null) return '—';
    return this.formatPnlPct(pct);
  }

  /** Première position ouverte (pour seuils stop/take profit). */
  firstOpenPosition(): BotOpenTradeItem | null {
    const list = this.bot.activePositions();
    return list.length ? list[0] : null;
  }

  /** Formate une décimale en % affiché (ex. 0.00835 → "+0,84 %"). */
  formatPnlPct(decimal: number): string {
    const pct = decimal * 100;
    const raw = Math.abs(pct).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return pct >= 0 ? `+${raw} %` : `-${raw} %`;
  }

  /** Ajoute ou retire un métal de la sélection (formulaire de démarrage). */
  toggleMetal(metal: BotMetal): void {
    const i = this.selectedMetals.indexOf(metal);
    if (i >= 0) {
      this.selectedMetals = this.selectedMetals.filter(m => m !== metal);
    } else {
      this.selectedMetals = [...this.selectedMetals, metal];
    }
  }

  isMetalSelected(metal: BotMetal): boolean {
    return this.selectedMetals.includes(metal);
  }

  startBot(): void {
    this.bot.start(
      this.capitalAllocate,
      this.selectedMetals,
      this.selectedLeverage,
      this.selectedLots
    ).subscribe();
  }

  stopBot(): void {
    this.bot.stop().subscribe();
  }

  /** Id de la position en cours de vente manuelle (pour désactiver le bouton). */
  sellingPositionId: string | null = null;

  sellPosition(pos: BotOpenTradeItem): void {
    this.sellingPositionId = pos.id;
    this.bot.sellPosition(pos.metal).subscribe({
      next: () => { this.sellingPositionId = null; },
      error: () => { this.sellingPositionId = null; },
    });
  }

  formatBotPct(decimal: number, forceSign?: 'plus' | 'minus'): string {
    const pct = decimal * 100;
    const raw = Math.abs(pct).toFixed(1).replace('.', ',');
    if (forceSign === 'plus') return `+${raw}`;
    if (forceSign === 'minus') return `-${raw}`;
    return pct >= 0 ? `+${raw}` : `-${raw}`;
  }

  configSummary(cfg: BotConfigDto): string {
    const tp = this.formatBotPct(cfg.takeProfitPct, 'plus');
    const sl = this.formatBotPct(cfg.stopLossPct, 'minus');
    const minEur = cfg.takeProfitMinEur != null ? `, min ${cfg.takeProfitMinEur} €` : '';
    return `TP ${tp} %${minEur}, SL ${sl} %`;
  }

  /** Libellés des métaux tradés (config.metals) pour affichage en lecture seule. */
  configMetalsLabel(): string {
    const metals = this.bot.config()?.metals;
    return metals?.length ? metals.map(m => this.metalLabel(m)).join(', ') : '';
  }

  stopPrice(entryPrice: number, cfg: BotConfigDto): number {
    return entryPrice * (1 + cfg.stopLossPct);
  }

  takeProfitPrice(entryPrice: number, cfg: BotConfigDto): number {
    return entryPrice * (1 + cfg.takeProfitPct);
  }

  toggleConfig(): void {
    this.configExpanded = !this.configExpanded;
  }

  private loadBias(): void {
    this.analysisLoading = true;
    this.analysisError = false;
    forkJoin({
      gold: this.analysisService.getBias('gold'),
      silver: this.analysisService.getBias('silver'),
      platinum: this.analysisService.getBias('platinum'),
    }).subscribe({
      next: ({ gold, silver, platinum }) => {
        this.biasByMetal = { gold: gold ?? null, silver: silver ?? null, platinum: platinum ?? null };
        this.analysisLoading = false;
      },
      error: err => {
        this.analysisLoading = false;
        this.analysisError = true;
        console.error('Erreur chargement biais (réseau ou backend):', err);
      },
    });
  }

  private loadQuotes(): void {
    this.loading = true;
    forkJoin({
      gold: this.metalService.getLatestQuote('gold'),
      silver: this.metalService.getLatestQuote('silver'),
      platinum: this.metalService.getLatestQuote('platinum'),
    }).subscribe({
      next: ({ gold, silver, platinum }) => {
        this.metals[0].quote = gold;
        this.metals[1].quote = silver;
        this.metals[2].quote = platinum;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  formatPrice(quote: MetalQuote | null): string {
    if (!quote || quote.price === 0) return '—';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(quote.price) + ' €';
  }

  formatTrend(quote: MetalQuote | null): string | null {
    if (!quote || quote.trendPercent == null) return null;
    const sign = quote.trendPercent >= 0 ? '+' : '';
    return `${sign}${quote.trendPercent.toFixed(2)}%`;
  }

  isTrendPositive(quote: MetalQuote | null): boolean {
    return quote?.trendPercent != null && quote.trendPercent >= 0;
  }

  /** Reçoit le dernier prix émis par un graphique et met à jour la carte correspondante. */
  onQuote(metalId: MetalType, quote: MetalQuote): void {
    this.metals = this.metals.map(m => (m.id === metalId ? { ...m, quote } : m));
  }

  setTimeframe(tf: TimeframeKey): void {
    this.activeTf = tf;
  }

  setChartType(type: ChartType): void {
    this.activeChartType = type;
  }

  getAnalysis(metal: MetalType): BiasApiResponse | null {
    return this.biasByMetal[metal];
  }

  /** Biais affiché sur la carte : dérivé de GET /api/market/bias (combined_bias). */
  getPrediction(metal: MetalType): { combinedBias: 'bullish' | 'bearish' | 'neutral'; weightedScore: number } | null {
    const bias = this.biasByMetal[metal];
    if (bias == null) return null;
    const score = bias.combined_bias;
    const combinedBias: 'bullish' | 'bearish' | 'neutral' =
      score > 0.15 ? 'bullish' : score < -0.15 ? 'bearish' : 'neutral';
    return { combinedBias, weightedScore: Math.round(score * 100) / 100 };
  }

  isAnalysisExpanded(metal: MetalType): boolean {
    return this.expandedByMetal[metal];
  }

  toggleAnalysis(metal: MetalType): void {
    this.expandedByMetal = { ...this.expandedByMetal, [metal]: !this.expandedByMetal[metal] };
  }

  /** Libellé biais combiné */
  biasLabel(bias: 'bullish' | 'bearish' | 'neutral'): string {
    return bias === 'bullish' ? 'Hausse' : bias === 'bearish' ? 'Baisse' : 'Neutre';
  }

  /** Impact exogène pour affichage (signaux LE PRÉSENT du backend) */
  impactIcon(signal: BiasPresentSignalDto): string {
    return signal.impact === 'bullish' ? '↑' : signal.impact === 'bearish' ? '↓' : '−';
  }

  /** Tooltip au survol du score : date de calcul côté backend. */
  getBiasTooltip(metal: MetalType): string {
    const b = this.biasByMetal[metal];
    if (!b?.computed_at) return 'Score combiné (backend)';
    try {
      const d = new Date(b.computed_at);
      return `Calculé à ${d.toLocaleString('fr-FR')}`;
    } catch {
      return 'Score combiné (backend)';
    }
  }
}
