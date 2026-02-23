import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";

const MONTHS = [
  'ALL',
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

@Component({
  selector: 'month-filter',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule,MatSelectModule],
  template: `
    <mat-form-field appearance="outline" class="form-dense">
      <mat-label>Mois</mat-label>
      <mat-select [value]="month" (selectionChange)="setMonth($event.value)">
        <mat-option *ngFor="let m of MONTHS"[value]="m">
          {{ m }}
        </mat-option>
      </mat-select>
    </mat-form-field>
  `,
})

export class MonthFilter {

  MONTHS = MONTHS;
  @Input() month!: string | 'ALL';
  @Output() monthChange = new EventEmitter<string | 'ALL'>();

  setMonth(m: string | 'ALL') {
    if (!m) return;
    this.monthChange.emit(m);
  }
}
