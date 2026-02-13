import { Component, EventEmitter, Input, Output } from "@angular/core";
import { MatButtonToggleModule } from '@angular/material/button-toggle';

@Component({
    selector: 'period-filter',
    standalone: true,
    imports: [ MatButtonToggleModule ],
    template: `
    <mat-button-toggle-group class="form-dense"
                             [value]="period" 
                             (valueChange)="setPeriod($event)"
                             exclusive>
      <mat-button-toggle [value]="3">3M</mat-button-toggle>
      <mat-button-toggle [value]="6">6M</mat-button-toggle>
      <mat-button-toggle [value]="12">12M</mat-button-toggle>
    </mat-button-toggle-group>`,
})
export class periodFilter {

    @Input() period!: number;
    @Output() periodChange = new EventEmitter<number>();

    setPeriod(p: number) {
        if (!p) return;
        this.periodChange.emit(p);
    }

}