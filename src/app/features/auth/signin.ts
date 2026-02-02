import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DialogService } from '../../core/services/dialog.service';

import { AuthFormComponent } from './auth-form/auth-form';
import { switchMap } from 'rxjs';

@Component({
  standalone: true,
  imports: [AuthFormComponent],
  template: `
    <app-auth-form
      title="Inscription"
      subtitle="Créez votre compte"
      [form]="form"
      [showNameFields]="true"
      submitLabel="S'inscrire"
      (submitForm)="signin()"
    />
  `
})
export class Signin {

  form;
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private dialog : DialogService,
    private router: Router
  ) {
    this.form = this.fb.nonNullable.group({
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  signin() {

    const { email, password } = this.form.value;

    this.authService.signin(this.form.getRawValue())
      .pipe(
        switchMap(() =>
          this.authService.login(email!, password!)
        )
      )
      .subscribe({
        next: () => {
          this.dialog.success('Inscription réussie 🔥');
          this.router.navigate(['/dashboard']);
        },
        error: err => {
          this.dialog.error('Erreur lors de la création du compte');
        }
      });
  }
}
