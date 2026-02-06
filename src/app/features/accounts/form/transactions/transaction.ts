import { Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { AccountService } from '../../../../core/services/account.service';
import { TransactionService } from '../../../../core/services/transaction.service';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule, MatFormFieldModule,MatInputModule,MatButtonModule,MatSelectModule],
  templateUrl: './transaction.html'
})
export class TransactionForm {
  private fb = inject(FormBuilder);
  private accountService = inject(AccountService);
  private transactionService = inject(TransactionService);
  private dialogRef = inject(MatDialogRef);

  mode = input.required<'CREDIT' | 'DEBIT'>();
  accountId = input.required<string>();
  cancel = output<void>();
  submitted = output<any>();

  otherAccounts = computed(() => 
    this.accountService.accounts().filter(acc => acc.id !== this.accountId())
  );

  categories = computed(() => {
    return [
          { value: 'LOYER', label: 'Loyer' },
          { value: 'IMPOT', label: 'Impôt' },
          { value: 'LOISIR', label: 'Loisir' },
          { value: 'COURSE', label: 'Course' },
          { value: 'CHARGE', label: 'Charge' },
          { value: 'AUTOMOBILE', label: 'Automobile' }
        ]
  });

  form = this.fb.group({
    amount: [null, [Validators.required, Validators.min(0.01)]],
    typeTransaction: [null, Validators.required],
    iban: ['', Validators.required], 
    internalAccount: [null],
  });

  onInternalAccountChange(iban: string) {
    this.form.patchValue({ iban: iban });
  }

  onSubmit() {
    if (this.form.valid) {
      const isDebit = this.mode() === 'DEBIT';
      const formVal = this.form.value;

      const payload = {
        fromAccountId: isDebit ? this.accountId() : formVal.internalAccount,
        toAccountId: isDebit ? formVal.iban : this.accountId(),
        amount: formVal.amount,
        label: formVal.typeTransaction,
        type: this.mode()
      };

      this.transactionService.createTransaction(payload).subscribe({
        next: () => {
          this.dialogRef.close(true);
          alert("Virement effectué");
        },
        error: () => alert("Échec du virement")
      });
      this.submitted.emit(payload);
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}