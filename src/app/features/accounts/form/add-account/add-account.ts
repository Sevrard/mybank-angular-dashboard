import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';
import { AccountService } from '../../../../core/services/account.service';

@Component({
  selector: 'app-add-account-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule, 
    MatButtonModule, 
    MatIconModule
  ],
  templateUrl: './add-account.html',
  styleUrls: ['./add-account.scss']
})
export class addAccountForm {
  private fb = inject(NonNullableFormBuilder);
  private dialogRef = inject(MatDialogRef);
  private accountService = inject(AccountService);
  isLoading = signal(false);

  accountForm = this.fb.group({
    accountType: ['Compte Courant', Validators.required],
    initialBalance: [0, [Validators.required, Validators.min(0)]]
  });

  onSubmit() {
    if (this.accountForm.valid) {
      this.isLoading.set(true);

      const { accountType, initialBalance } = this.accountForm.getRawValue();

      const payload = {
        name: accountType,
        initialBalance: initialBalance,
        userId: localStorage.getItem('userId') 
      };
      
      //this.accountService.testPayload(payload);
      this.accountService.createAccount(payload).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.dialogRef.close(true);
        },
        error: () => {
          this.isLoading.set(false);
          this.dialogRef.close(true);
        }
      });
    }
  }
  

  onCancel() {
    this.dialogRef.close();
  }
}