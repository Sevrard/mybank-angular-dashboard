import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy, Input, OnChanges, inject, effect } from '@angular/core';
import { Chart, PolarAreaController, ArcElement, Tooltip, Legend, RadialLinearScale } from 'chart.js';
import { ThemeService } from '../../../../core/services/theme.service';

Chart.register(PolarAreaController, ArcElement, Tooltip, Legend, RadialLinearScale);

@Component({
  selector: 'app-pie-chart',
  standalone: true,
  template: `
    <div class="chart-container">
      <canvas #pieCanvas></canvas>
    </div>
  `,
  styles: [`
    .chart-container { 
      height: 200px; 
      width: 100%; 
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  `]
})
export class PieChart implements AfterViewInit, OnDestroy, OnChanges {
  @Input({ required: true }) data: number[] = [];
  @Input({ required: true }) labels: string[] = [];

  @ViewChild('pieCanvas') canvas!: ElementRef<HTMLCanvasElement>;
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

  private tryInitOrUpdate() {
    if (!this.viewReady || !this.data || this.data.length === 0) return;
    if (!this.chart) {
      this.initChart();
    } else {
      this.updateChartData();
    }
  }

  private initChart() {
    const textColor = this.getCssVar('--mat-text-sec', '#8b8e94');
    const cardColor = this.getCssVar('--mat-card', '#121817');
    const gridColor = this.getCssVar('--mat-divider', 'rgba(255,255,255,0.05)');

    this.chart = new Chart(this.canvas.nativeElement, {
      type: 'polarArea', 
      data: {
        labels: this.labels,
        datasets: [{
          data: this.data,
          backgroundColor: [
            'rgba(45, 212, 191, 0.7)', // Teal
            'rgba(167, 139, 250, 0.7)', // Violet
            'rgba(251, 113, 133, 0.7)', // Rose
            'rgba(251, 191, 36, 0.7)',  // Amber
            'rgba(56, 189, 248, 0.7)',  // Sky
            'rgba(129, 140, 248, 0.7)'  // Indigo
          ],
          borderColor: cardColor,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            display: true,
            grid: { color: gridColor },
            ticks: { display: false },
            angleLines: { color: gridColor }
          }
        },
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: textColor,
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 15,
              font: { size: 11 }
            }
          },
          tooltip: {
            backgroundColor: cardColor,
            titleColor: this.getCssVar('--mat-text', '#fff'),
            bodyColor: this.getCssVar('--mat-text', '#fff'),
            borderColor: gridColor,
            borderWidth: 1
          }
        }
      }
    });
  }

  private updateChartData() {
    if (!this.chart) return;
    this.chart.data.labels = this.labels;
    this.chart.data.datasets[0].data = this.data;
    this.chart.update();
  }

  private updateChartTheme() {
    if (!this.chart) return;
    const textColor = this.getCssVar('--mat-text-sec', '#8b8e94');
    const cardColor = this.getCssVar('--mat-card', '#121817');
    const gridColor = this.getCssVar('--mat-divider', 'rgba(255,255,255,0.05)');

    if (this.chart.options.plugins?.legend?.labels) {
      this.chart.options.plugins.legend.labels.color = textColor;
    }
    
    if (this.chart.options.scales?.['r']) {
      const rScale = this.chart.options.scales['r'] as any;
      rScale.grid.color = gridColor;
      rScale.angleLines.color = gridColor;
    }

    this.chart.data.datasets[0].borderColor = cardColor;
    this.chart.update();
  }

  private getCssVar(name: string, fallback: string): string {
    if (typeof window === 'undefined') return fallback;
    return getComputedStyle(document.body).getPropertyValue(name).trim() || fallback;
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}