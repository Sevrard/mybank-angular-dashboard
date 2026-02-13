import { Component, ElementRef, OnDestroy, effect, input, viewChild } from '@angular/core';
import { Chart, PolarAreaController, ArcElement, Tooltip, Legend, RadialLinearScale } from 'chart.js';

Chart.register(PolarAreaController, ArcElement, Tooltip, Legend, RadialLinearScale);

@Component({
  selector: 'app-polar-chart',
  standalone: true,
  template: `<div class="chart-container"><canvas #polarCanvas></canvas></div>`,
  styles: [`.chart-container { position: relative; height: 200px; width: 100%; }`]
})
export class PolarChart implements OnDestroy {
  data = input.required<number[]>();
  labels = input.required<string[]>();

  canvas = viewChild<ElementRef<HTMLCanvasElement>>('polarCanvas');
  
  private chart?: Chart;

  constructor() {
    effect(() => {
      const el = this.canvas();
      const currentData = this.data();
      const currentLabels = this.labels();

      if (el && currentData.length > 0) {
        this.updateOrCreateChart(el.nativeElement, currentData, currentLabels);
      }
    });
  }

  private updateOrCreateChart(canvas: HTMLCanvasElement, data: number[], labels: string[]) {
    if (!this.chart) {
      this.chart = new Chart(canvas, {
        type: 'polarArea',
        data: {
          labels: labels,
          datasets: [{
            data: data,
              backgroundColor: [
                '#2dd4bf', // Teal (existant)
                '#38bdf8', // Sky Blue (existant)
                '#fb7185', // Rose (existant)
                '#fbbf24', // Amber (existant)
                '#a78bfa', // Violet (NOUVEAU)
                '#fb923c', // Orange (NOUVEAU)
                '#efecf0'  // Indigo (NOUVEAU)
              ],
            borderColor: '#121817',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              grid: { color: 'rgba(255, 255, 255, 0.1)' },
              angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
              ticks: { display: false }
            }
          },
          plugins: {
            legend: {
              position: 'right',
              labels: { color: '#8b8e94', font: { size: 12, family: 'Inter' } }
            }
          }
        }
      });
    } else {
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = data;
      this.chart.update();
    }
  }

  ngOnDestroy() {
    this.chart?.destroy();
  }
}