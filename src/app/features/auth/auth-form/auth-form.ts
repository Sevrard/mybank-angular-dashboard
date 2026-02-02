import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-auth-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './auth-form.html',
  styleUrls: ['./auth-form.scss']
})
export class AuthFormComponent {

  @Input() title = '';
  @Input() subtitle = '';
  @Input() form!: FormGroup;
  @Input() loading = false;
  @Input() showNameFields = false;
  @Input() submitLabel = 'Valider';

  @Output() submitForm = new EventEmitter<void>();

  submit() {
    if (this.form.invalid || this.loading) return;
    this.submitForm.emit();
  }
}
