import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';


export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'success' | 'error' | 'info';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule,MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>

    <mat-dialog-content class="content" [class]="data.type">
      {{ data.message }}
    </mat-dialog-content>

    <mat-dialog-actions>
      <button
        mat-button
        mat-dialog-close
        *ngIf="data.cancelText"
      >
        {{ data.cancelText }}
      </button>

      <button
        mat-flat-button
        color="primary"
        [mat-dialog-close]="true"
      >
        {{ data.confirmText ?? 'OK' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .content {
      padding-top: 8px;
      font-size: 14px;
    }
    .success { color: #4caf50; }
    .error { color: #f44336; }
    .info { color: #90caf9; }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}
}
