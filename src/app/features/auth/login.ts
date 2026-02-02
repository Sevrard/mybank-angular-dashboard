import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthFormComponent } from './auth-form/auth-form';

import { AuthService } from '../../core/services/auth.service';
import { DialogService } from '../../core/services/dialog.service'; import { finalize } from 'rxjs';
;

@Component({
  standalone: true,
  imports: [AuthFormComponent],
  template: `
    <app-auth-form
      title="Connexion"
      subtitle="Accédez à votre espace"
      [form]="form"
      submitLabel="Se connecter"
      (submitForm)="login()"
    />
  `
})
export class Login {

  form;
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private dialog: DialogService,
    private router: Router
  ) {
    this.form = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  login() {
    if (this.form.invalid) return;

    this.authService.login(
      this.form.value.email!,
      this.form.value.password!
    ).subscribe({
      next: () => {
        this.dialog.success('Connexion réussie 🎉');
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.dialog.error('Email ou mot de passe invalide');
      }
    });
  }


}
