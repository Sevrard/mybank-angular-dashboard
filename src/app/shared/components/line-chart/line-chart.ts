import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnDestroy,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler
} from 'chart.js';
import { Transaction } from '../../../services/dashboard-data';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler
);

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

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.tryInitOrUpdate();
  }

  ngOnChanges(): void {
    this.tryInitOrUpdate();
  }

  private tryInitOrUpdate() {
    if (!this.viewReady) return;
    if (!this.transactions || this.transactions.length === 0) return;

    const monthlyBalance = this.computeMonthlyBalance(this.transactions);

    if (!this.chart) {
      this.initChart(monthlyBalance);
    } else {
      this.updateChart(monthlyBalance);
    }
  }

  private initChart(data: { labels: string[]; values: number[] }) {
    this.chart = new Chart(this.canvas.nativeElement, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Solde',
            data: data.values,
            borderColor: '#1de9b6',
            fill: 'origin',
            tension: 0.45,
            pointRadius: 4,
            pointHoverRadius: 6,

            backgroundColor: (ctx) => {
              const chart = ctx.chart;
              const { ctx: c, chartArea, scales } = chart;

              if (!chartArea) return;

              const yScale = scales['y'];
              const zeroY = yScale.getPixelForValue(0);

              const gradient = c.createLinearGradient(
                0,
                chartArea.top,
                0,
                chartArea.bottom
              );

              const zeroPos =
                (zeroY - chartArea.top) / (chartArea.bottom - chartArea.top);

              gradient.addColorStop(0, 'rgba(29,233,182,0.35)');
              gradient.addColorStop(Math.max(0, zeroPos - 0.01), 'rgba(29,233,182,0.15)');
              gradient.addColorStop(Math.min(1, zeroPos + 0.01), 'rgba(239,68,68,0.15)');
              gradient.addColorStop(1, 'rgba(239,68,68,0.35)');

              return gradient;
            }
          },

          {
            label: 'Zero',
            data: new Array(data.values.length).fill(0),
            borderColor: 'rgba(255,255,255,0.15)',
            borderWidth: 1,
            pointRadius: 0,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#121212',
            titleColor: '#fff',
            bodyColor: '#fff'
          }
        },
        scales: {
          x: {
            ticks: { color: '#b0bec5' },
            grid: { display: false }
          },
          y: {
            ticks: { color: '#94a3b8' },
            grid: {
              color: ctx =>
                ctx.tick.value === 0
                  ? 'rgba(255,255,255,0.25)'
                  : 'rgba(255,255,255,0.05)'
            }
          }
        }
      }
    });
  }

  private updateChart(data: { labels: string[]; values: number[] }) {
    this.chart!.data.labels = data.labels;
    this.chart!.data.datasets[0].data = data.values;
    this.chart!.update();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private computeMonthlyBalance(tx: Transaction[]) {
    const months = [...new Set(tx.map(t => t.month))];

    let balance = 0;
    const values: number[] = [];

    months.forEach(m => {
      tx.filter(t => t.month === m)
        .forEach(t => balance += t.amount);

      values.push(Number(balance.toFixed(2)));
    });

    return {
      labels: months,
      values
    };
  }

}
