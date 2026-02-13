import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy, Input, OnChanges, effect, inject} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler } from 'chart.js';
import { Transaction } from '../../../../core/models/transaction.model';
import { ThemeService } from '../../../../core/services/theme.service';

Chart.register( LineController,LineElement,PointElement,LinearScale,CategoryScale,Tooltip,Filler);

@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [MatCardModule],
  templateUrl: './line-chart.html',
  styleUrl: './line-chart.scss',
})
export class LineChart implements AfterViewInit, OnDestroy, OnChanges {

  @Input({ required: true }) transactions: Transaction[] = [];
  @ViewChild('balanceChart') canvas!: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;
  private viewReady = false;
  private themeService = inject(ThemeService);

  constructor() {
    effect(() => {
      this.themeService.activeTheme(); 
      if (this.chart && this.viewReady) {
        setTimeout(() => this.updateChartTheme(), 50); 
      }
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.tryInitOrUpdate();
  }

  ngOnChanges(): void {
    this.tryInitOrUpdate();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private tryInitOrUpdate() {
    if (!this.viewReady) return;
    if (!this.transactions || this.transactions.length === 0) return;

    const monthlyBalance = this.computeMonthlyBalance(this.transactions);

    if (!this.chart) {
      this.initChart(monthlyBalance);
    } else {
      this.updateChartData(monthlyBalance);
    }
  }

  private initChart(data: { labels: string[]; values: number[] }) {
    const textColor = this.getCssVar('--mat-text-sec', '#94a3b8');
    const gridColor = this.getCssVar('--mat-divider', 'rgba(255,255,255,0.1)');
    const tooltipBg = this.getCssVar('--mat-card', '#121212');
    const tooltipText = this.getCssVar('--mat-text', '#fff');

    this.chart = new Chart(this.canvas.nativeElement, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Solde',
            data: data.values,
            fill: 'origin',
            tension: 0.45,
            pointRadius: 4,
            pointHoverRadius: 6,

            borderColor: (ctx) => {
              const { ctx: c, chartArea, scales } = ctx.chart;
              if (!chartArea || !scales['y']) return this.getCssVar('--mat-valid', '#2CD4BF');

              const zeroY = scales['y'].getPixelForValue(0);
              const zeroPos = Math.max(0, Math.min(1, (zeroY - chartArea.top) / (chartArea.bottom - chartArea.top)));
              
              const colorIn = this.getCssVar('--mat-valid', '#2CD4BF');
              const colorOut = this.getCssVar('--mat-warn', '#F44336');

              const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
              gradient.addColorStop(0, colorIn);
              gradient.addColorStop(zeroPos, colorIn);
              gradient.addColorStop(zeroPos, colorOut);
              gradient.addColorStop(1, colorOut);

              return gradient;
            },

            backgroundColor: (ctx) => {
              const { ctx: c, chartArea, scales } = ctx.chart;
              if (!chartArea || !scales['y']) return 'transparent';

              const zeroY = scales['y'].getPixelForValue(0);
              const zeroPos = Math.max(0, Math.min(1, (zeroY - chartArea.top) / (chartArea.bottom - chartArea.top)));

              const colorIn = this.getCssVar('--mat-valid', '#2CD4BF');
              const colorOut = this.getCssVar('--mat-warn', '#F44336');

              const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
              gradient.addColorStop(0, this.toRgba(colorIn, 0.35));
              gradient.addColorStop(zeroPos, this.toRgba(colorIn, 0.05));
              gradient.addColorStop(zeroPos, this.toRgba(colorOut, 0.05));
              gradient.addColorStop(1, this.toRgba(colorOut, 0.35));

              return gradient;
            }
          },
          {
            label: 'Zero',
            data: new Array(data.values.length).fill(0),
            borderColor: gridColor,
            borderWidth: 1,
            pointRadius: 0,
            borderDash: [5, 5]
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: tooltipBg,
            titleColor: tooltipText,
            bodyColor: tooltipText,
            borderColor: gridColor,
            borderWidth: 1,
            displayColors: false
          }
        },
        scales: {
          x: {
            ticks: { color: textColor },
            grid: { display: false }
          },
          y: {
            ticks: { color: textColor },
            grid: { color: gridColor }
          }
        }
      }
    });
  }

  private updateChartData(data: { labels: string[]; values: number[] }) {
    if (!this.chart) return;
    this.chart.data.labels = data.labels;
    this.chart.data.datasets[0].data = data.values;
    this.chart.data.datasets[1].data = new Array(data.values.length).fill(0);
    this.chart.update();
  }

  private updateChartTheme() {
    if (!this.chart) return;
    
    const textColor = this.getCssVar('--mat-text-sec', '#94a3b8');
    const gridColor = this.getCssVar('--mat-divider', 'rgba(255,255,255,0.1)');
    const tooltipBg = this.getCssVar('--mat-card', '#121212');
    const tooltipText = this.getCssVar('--mat-text', '#fff');

    if (this.chart.options.scales?.['x']?.ticks) this.chart.options.scales['x'].ticks.color = textColor;
    if (this.chart.options.scales?.['y']?.ticks) this.chart.options.scales['y'].ticks.color = textColor;
    if (this.chart.options.scales?.['y']?.grid) this.chart.options.scales['y'].grid.color = gridColor;

    if (this.chart.options.plugins?.tooltip) {
      this.chart.options.plugins.tooltip.backgroundColor = tooltipBg;
      this.chart.options.plugins.tooltip.titleColor = tooltipText;
      this.chart.options.plugins.tooltip.bodyColor = tooltipText;
      this.chart.options.plugins.tooltip.borderColor = gridColor;
    }

    this.chart.data.datasets[1].borderColor = gridColor;
    this.chart.update(); 
  }

  private getCssVar(name: string, fallback: string): string {
    if (typeof window === 'undefined') return fallback;
    const value = getComputedStyle(document.body).getPropertyValue(name).trim();
    return value || fallback;
  }

  private toRgba(color: string, alpha: number): string {
    color = color.trim();
    if (color.startsWith('rgb')) {
      const coords = color.match(/\d+(\.\d+)?/g);
      if (coords && coords.length >= 3) {
        return `rgba(${coords[0]}, ${coords[1]}, ${coords[2]}, ${alpha})`;
      }
    } else if (color.startsWith('#')) {
      let hex = color.replace('#', '');
      if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
  }

  private computeMonthlyBalance(tx: Transaction[]) {
    const months = [...new Set(tx.map(t => t.month))];
    let balance = 0;
    const values: number[] = [];

    months.forEach(m => {
      tx.filter(t => t.month === m).forEach(t => balance += t.amount);
      values.push(Number(balance.toFixed(2)));
    });

    return { labels: months, values };
  }
}