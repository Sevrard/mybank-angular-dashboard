import { Component, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { LineChart } from '../../shared/components/line-chart/line-chart';
import { BarChart } from '../../shared/components/bar-chart/bar-chart';
import { DashboardFakeDataService } from '../../core/services/dashboard-fake-data.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush, 
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonToggleModule,
    MatIconModule,
    LineChart,
    BarChart,
    MatFormFieldModule,
    MatSelectModule
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard {

  @ViewChild('pdfContent') pdfContent!: ElementRef;

  displayedColumns = ['type', 'from', 'amount', 'date'];

  constructor(public data: DashboardFakeDataService) { }
  
  setPeriod(p: string | number) {
    if (!p) return;
    const periodNumber = Number(p);
    this.data.setPeriod(periodNumber);
    this.data.setMonth("ALL");
  }

  setMonth(month: string) {
    this.data.setMonth(month);
  }

  exportPdf() {
    const element = this.pdfContent.nativeElement;

    html2canvas(element, { 
      scale: 2, 
      backgroundColor: '#0b0f0e', 
      useCORS: true 
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4'});
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`mybank-dashboard-${new Date().toISOString().slice(0, 10)}.pdf`);
    });
  }
}