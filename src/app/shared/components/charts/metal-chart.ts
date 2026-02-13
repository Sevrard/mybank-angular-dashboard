import { Component, AfterViewInit,OnDestroy,ViewChild,ElementRef,inject,Input} from '@angular/core';
import {createChart,AreaSeries,IChartApi,ISeriesApi,UTCTimestamp} from 'lightweight-charts';
import { MetalService } from '../../../core/services/metal-stream.service';

type MetalType = 'gold' | 'silver' | 'platinum';

const METAL_STYLE: Record<MetalType,{ line: string; top: string; bottom: string }> = {
  gold: {
    line: '#f3ba2f',
    top: 'rgba(243,186,47,0.25)',
    bottom: 'rgba(243,186,47,0)',
  },
  silver: {
    line: '#9ca3af',
    top: 'rgba(156,163,175,0.25)',
    bottom: 'rgba(156,163,175,0)',
  },
  platinum: {
    line: '#6cb3f0',                  
    top: 'rgba(149, 192, 230, 0.28)',
    bottom: 'rgba(191,199,206,0)',
    },
};

@Component({
  selector: 'app-metal-chart',
  template: `<div #chartContainer class="chart"></div>`,
  styles: [
    `.chart {
        width: 100%;
        height: 400px;
      }`,
  ],
})

export class MetalChartComponent implements AfterViewInit, OnDestroy {

  @Input({ required: true }) metal!: 'gold' | 'silver' | 'platinum';
  @ViewChild('chartContainer', { static: true })
  chartContainer!: ElementRef<HTMLDivElement>;

  private metalService = inject(MetalService);
  private chart!: IChartApi;
  private series!: ISeriesApi<'Area'>;
  private socket?: WebSocket;

  ngAfterViewInit(): void {
    this.initChart();
    this.loadHistory();
  }

  ngOnDestroy(): void {
    this.socket?.close();
    this.chart?.remove();
  }

  private initChart(): void {
    const style = METAL_STYLE[this.metal];

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

    this.series = this.chart.addSeries(AreaSeries, {
      lineColor: style.line,
      topColor: style.top,
      bottomColor: style.bottom,
      lineWidth: 2,
    });
  }

  private loadHistory(): void {
    console.log(this.metal);
    this.metalService.getHistory(this.metal).subscribe({
      next: data => {
        this.series.setData(data);
        this.chart.timeScale().fitContent();
        this.connectLive();
      },
      error: err =>
        console.error(`Erreur historique ${this.metal}`, err),
    });
  }

  private connectLive(): void {
    const socket = this.metalService.connectLive?.(this.metal);
    if (!socket) return;

    this.socket = socket;

    this.socket.onmessage = event => {
      const msg = JSON.parse(event.data);
      if (!msg.k) return;

      this.series.update({
        time: (msg.k.t / 1000) as UTCTimestamp,
        value: Number(msg.k.c),
      });
    };
  }
}
