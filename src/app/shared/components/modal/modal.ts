// modal-container.component.ts
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { addAccountForm } from '../../../features/accounts/form/add-account/add-account';
import { TransactionForm } from '../../../features/accounts/form/transactions/transaction';


@Component({
  standalone: true,
  imports: [CommonModule, MatDialogModule, addAccountForm, TransactionForm],
  template: `
    <div class="modal-header">
      <h2 mat-dialog-title>{{ data.title }}</h2>
      <button class="close-btn" (click)="ref.close()">×</button>
    </div>
    <mat-dialog-content>
      @switch (data.type) {
        @case ('add') {
          <app-add-account-form></app-add-account-form>
        }
        @case ('debit') {
          <app-transaction-form mode="DEBIT" [accountId]="data.accountId"></app-transaction-form>
        }
        @case ('credit') {
          <app-transaction-form mode="CREDIT" [accountId]="data.accountId"></app-transaction-form>
        }
        @default {
          <p>Action non reconnue</p>
        }
      }
    </mat-dialog-content>
  `,
  styles: [`
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem; }
    .close-btn { background: none; border: none; color: white; cursor: pointer; font-size: 1.5rem; }
    mat-dialog-content { min-width: 400px; padding: 20px; color: white; }
  `]
})
export class ModalContainer {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { id:string, title: string, type: string, accountId:string },
    public ref: MatDialogRef<ModalContainer>
  ) { }
}