import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy, Input, OnChanges } from '@angular/core';
import { Chart, PieController, ArcElement, Tooltip, Legend } from 'chart.js';

Chart.register(PieController, ArcElement, Tooltip, Legend);

@Component({
  selector: 'app-pie-chart',
  standalone: true,
  template: `<div style="height: 200px; position: relative;"><canvas #pieCanvas></canvas></div>`,
})
export class PieChart implements AfterViewInit, OnDestroy, OnChanges {
  @Input({ required: true }) data: number[] = [];
  @Input({ required: true }) labels: string[] = [];

  @ViewChild('pieCanvas') canvas!: ElementRef<HTMLCanvasElement>;
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
    if (!this.viewReady || !this.data.length) return;

    if (!this.chart) {
      this.initChart();
    } else {
      this.updateChart();
    }
  }

  private initChart() {
    this.chart = new Chart(this.canvas.nativeElement, {
      type: 'pie',
      data: {
        labels: this.labels,
        datasets: [{
          data: this.data,
          backgroundColor: [
            '#2dd4bf', // Teal (existant)
            '#38bdf8', // Sky Blue (existant)
            '#fb7185', // Rose (existant)
            '#fbbf24', // Amber (existant)
            '#a78bfa', // Violet (NOUVEAU)
            '#fb923c', // Orange (NOUVEAU)
            '#818cf8'  // Indigo (NOUVEAU)
          ],
          borderColor: '#121817', // Match fond de carte
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#8b8e94', font: { size: 12 } }
          }
        }
      }
    });
  }

  private updateChart() {
    this.chart!.data.labels = this.labels;
    this.chart!.data.datasets[0].data = this.data;
    this.chart!.update();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}