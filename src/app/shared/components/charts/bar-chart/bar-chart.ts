import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Input,
  OnDestroy,
  OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';


import {
  Chart,
  BarController,
  BarElement,
  LinearScale,
  CategoryScale,
  Tooltip
} from 'chart.js';

Chart.register(
  BarController,
  BarElement,
  LinearScale,
  CategoryScale,
  Tooltip
);

export interface MonthlyCashFlow {
  month: string;
  spending: number;
  arrival: number;
}

@Component({
  selector: 'app-bart-chart',
  standalone: true,
  imports: [CommonModule,MatCardModule],
  templateUrl: './bar-chart.html',
  styleUrls: ['./bar-chart.scss']
})
export class BarChart implements AfterViewInit, OnDestroy, OnChanges {

  @Input({ required: true }) data!: MonthlyCashFlow[];
  @ViewChild('chart') canvas!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  ngAfterViewInit(): void {
    const styles = getComputedStyle(document.documentElement);

    const arrivalColor =
      styles.getPropertyValue('--chart-primary').trim() || '#5b3df5';

    const spendingColor = '#e65f5d';

    this.chart = new Chart(this.canvas.nativeElement, {
      type: 'bar',
      data: {
        labels: this.data.map(d => d.month),
        datasets: [
          {
            label: 'Spending',
            data: this.data.map(d => d.spending),
            backgroundColor: spendingColor,
            borderRadius: 6,
            barThickness: 24
          },
          {
            label: 'Arrival',
            data: this.data.map(d => d.arrival),
            backgroundColor: arrivalColor,
            borderRadius: 6,
            barThickness: 24
          }
        ]
      },
      options: {
        responsive: true,
        animation: {
          duration: 500,
          easing: 'easeOutQuart'
        },
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#6b7280',
              boxWidth: 12,
              boxHeight: 12
            }
          },
          tooltip: {
            backgroundColor: '#111827',
            titleColor: '#fff',
            bodyColor: '#fff'
          }
        },
        scales: {
          x: {
            stacked: true,
            ticks: { color: '#6b7280' },
            grid: { display: false }
          },
          y: {
            stacked: true,
            ticks: { color: '#6b7280' },
            grid: {
              color: 'rgba(0,0,0,0.05)'
            }
          }
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.chart && changes['data']) {
      this.chart.data.labels = this.data.map(d => d.month);
      this.chart.data.datasets[0].data = this.data.map(d => d.spending);
      this.chart.data.datasets[1].data = this.data.map(d => d.arrival);
      this.chart.update();
    }
  }
}
