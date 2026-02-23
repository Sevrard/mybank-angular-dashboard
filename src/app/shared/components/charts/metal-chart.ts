import {
  Component,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  inject,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {
  createChart,
  AreaSeries,
  LineSeries,
  CandlestickSeries,
  IChartApi,
  ISeriesApi,
  UTCTimestamp,
} from 'lightweight-charts';
import { MetalService, type MetalQuote } from '../../../core/services/metal-stream.service';
import type { TimeframeKey } from '../../../core/services/metal-yahoo.service';
import type { CandleOhlc } from '../../../core/models/candle.model';

type MetalType = 'gold' | 'silver' | 'platinum';
export type ChartType = 'line' | 'area' | 'candle';

const METAL_STYLE: Record<
  MetalType,
  { line: string; top: string; bottom: string; upColor: string; downColor: string }
> = {
  gold: {
    line: '#f3ba2f',
    top: 'rgba(243,186,47,0.25)',
    bottom: 'rgba(243,186,47,0)',
    upColor: '#26a69a',
    downColor: '#ef5350',
  },
  silver: {
    line: '#9ca3af',
    top: 'rgba(156,163,175,0.25)',
    bottom: 'rgba(156,163,175,0)',
    upColor: '#26a69a',
    downColor: '#ef5350',
  },
  platinum: {
    line: '#6cb3f0',
    top: 'rgba(149, 192, 230, 0.28)',
    bottom: 'rgba(191,199,206,0)',
    upColor: '#26a69a',
    downColor: '#ef5350',
  },
};

@Component({
  selector: 'app-metal-chart',
  template: `<div #chartContainer class="chart"></div>`,
  styles: [
    `
      .chart {
        width: 100%;
        height: 400px;
      }
    `,
  ],
})
export class MetalChartComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input({ required: true }) metal!: MetalType;
  @Input() timeframe: TimeframeKey = '1M';
  @Input() chartType: ChartType = 'candle';

  /** Émet le dernier prix (et tendance) quand les données sont chargées ou mises à jour en direct (or). */
  @Output() quoteChange = new EventEmitter<MetalQuote>();

  @ViewChild('chartContainer', { static: true })
  chartContainer!: ElementRef<HTMLDivElement>;

  private metalService = inject(MetalService);
  private chart!: IChartApi;
  private series!: ISeriesApi<'Line'> | ISeriesApi<'Area'> | ISeriesApi<'Candlestick'>;
  private socket?: WebSocket;
  private chartInitialized = false;
  private lastData: CandleOhlc[] = [];
  private lastClose = 0;

  ngAfterViewInit(): void {
    this.initChart();
    this.loadHistory();
    this.chartInitialized = true;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.chartInitialized) return;
    if (changes['timeframe'] && !changes['timeframe'].firstChange) {
      this.disconnectLive();
      this.loadHistory();
    }
    if (changes['chartType'] && !changes['chartType'].firstChange && this.lastData.length > 0) {
      this.ensureSeriesType();
      this.applyDataToSeries();
    }
  }

  ngOnDestroy(): void {
    this.disconnectLive();
    this.chart?.remove();
  }

  private disconnectLive(): void {
    this.socket?.close();
    this.socket = undefined;
  }

  private initChart(): void {
    this.chart = createChart(this.chartContainer.nativeElement, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2a28' },
        horzLines: { color: '#1f2a28' },
      },
      rightPriceScale: {
        borderColor: '#1f2a28',
        textColor: '#9ca3af',
      },
      timeScale: {
        borderColor: '#1f2a28',
        timeVisible: true,
        secondsVisible: false,
      },
      width: this.chartContainer.nativeElement.clientWidth,
      height: 400,
    });
    this.ensureSeriesType();
  }

  private ensureSeriesType(): void {
    if (this.series) this.chart.removeSeries(this.series);
    const style = METAL_STYLE[this.metal];
    if (this.chartType === 'line') {
      this.series = this.chart.addSeries(LineSeries, {
        color: style.line,
        lineWidth: 2,
      });
    } else if (this.chartType === 'area') {
      this.series = this.chart.addSeries(AreaSeries, {
        lineColor: style.line,
        topColor: style.top,
        bottomColor: style.bottom,
        lineWidth: 2,
      });
    } else {
      this.series = this.chart.addSeries(CandlestickSeries, {
        upColor: style.upColor,
        downColor: style.downColor,
        borderVisible: true,
        wickUpColor: style.upColor,
        wickDownColor: style.downColor,
      });
    }
  }

  private applyDataToSeries(): void {
    if (this.lastData.length === 0) return;
    if (this.chartType === 'candle') {
      (this.series as ISeriesApi<'Candlestick'>).setData(this.lastData);
    } else {
      const lineData = this.lastData.map(d => ({ time: d.time, value: d.close }));
      (this.series as ISeriesApi<'Line'> | ISeriesApi<'Area'>).setData(lineData);
    }
    this.chart.timeScale().fitContent();
    this.emitLastQuote();
  }

  private emitLastQuote(): void {
    if (this.lastData.length === 0) return;
    const last = this.lastData[this.lastData.length - 1];
    this.lastClose = last.close;
    const previous = this.lastData.length >= 2 ? this.lastData[this.lastData.length - 2] : null;
    const trendPercent =
      previous != null && previous.close !== 0
        ? ((last.close - previous.close) / previous.close) * 100
        : null;
    this.quoteChange.emit({ price: last.close, trendPercent });
  }

  private loadHistory(): void {
    this.metalService.getHistory(this.metal, this.timeframe).subscribe({
      next: data => {
        this.lastData = data;
        this.ensureSeriesType();
        this.applyDataToSeries();
        if (this.timeframe === '1D') {
          this.connectLive();
        }
      },
      error: err => console.error(`Erreur historique ${this.metal}`, err),
    });
  }

  private connectLive(): void {
    const socket = this.metalService.connectLive(this.metal);
    if (!socket) return;
    this.socket = socket;
    this.socket.onmessage = event => {
      const msg = JSON.parse(event.data);
      if (!msg.k) return;
      const k = msg.k;
      const time = (k.t / 1000) as UTCTimestamp;
      const open = Number(k.o);
      const high = Number(k.h);
      const low = Number(k.l);
      const close = Number(k.c);
      if (this.chartType === 'candle') {
        (this.series as ISeriesApi<'Candlestick'>).update({ time, open, high, low, close });
      } else {
        (this.series as ISeriesApi<'Line'> | ISeriesApi<'Area'>).update({ time, value: close });
      }
      const trendPercent =
        this.lastClose !== 0 ? ((close - this.lastClose) / this.lastClose) * 100 : null;
      this.lastClose = close;
      this.quoteChange.emit({ price: close, trendPercent });
    };
  }
}
