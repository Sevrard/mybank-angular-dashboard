import { Component, ElementRef, OnDestroy, effect, input, viewChild } from '@angular/core';
import { 
  Chart, 
  BarController, 
  LineController, 
  BarElement, 
  PointElement, 
  LineElement, 
  CategoryScale, 
  LinearScale, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';

Chart.register(
  BarController, LineController, BarElement, 
  PointElement, LineElement, CategoryScale, 
  LinearScale, Tooltip, Legend, Filler
);

@Component({
  selector: 'app-combo-chart',
  standalone: true,
  template: `<div class="chart-wrapper"><canvas #comboCanvas></canvas></div>`,
  styles: [`.chart-wrapper { position: relative; height: 350px; width: 100%; }`]
})
export class ComboChart implements OnDestroy {
  labels = input.required<string[]>();
  incomeData = input.required<number[]>();   
  expenseData = input.required<number[]>(); 
  balanceData = input.required<number[]>();  

  canvas = viewChild<ElementRef<HTMLCanvasElement>>('comboCanvas');
  private chart?: Chart;

  constructor() {
    effect(() => {
      const el = this.canvas();
      if (el) this.updateOrCreateChart(el.nativeElement);
    });
  }

  private updateOrCreateChart(canvas: HTMLCanvasElement) {
    const data = {
      labels: this.labels(),
      datasets: [
        {
          type: 'line' as const,
          label: 'Évolution Solde',
          data: this.balanceData(),
          borderColor: '#FFFFFF', 
          borderWidth: 1,
          fill: false,
          tension: 0.4,
          pointBackgroundColor: '#ffffff',
          order: 1 
        },
        {
          type: 'bar' as const,
          label: 'Revenus',
          data: this.incomeData(),
          backgroundColor: '#2CD4BF',
          borderRadius: 6,
          order: 2,
          barPercentage: 0.4,   
          categoryPercentage: 0.8
        },
        {
          type: 'bar' as const,
          label: 'Dépenses',
          data: this.expenseData(),
          backgroundColor: '#94A3B8', 
          borderRadius: 6,
          order: 2,
          barPercentage: 0.4,      
          categoryPercentage: 0.8
        }
      ]
    };

    if (!this.chart) {
      this.chart = new Chart(canvas, {
        type: 'bar', 
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#8b8e94', font: { family: 'Inter' } } }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#8b8e94' } },
            y: { 
              grid: { color: 'rgba(255, 255, 255, 0.05)' }, 
              ticks: { color: '#8b8e94' } 
            }
          }
        }
      });
    } else {
      this.chart.data = data;
      this.chart.update('none'); 
    }
  }

  ngOnDestroy() { this.chart?.destroy(); }
}