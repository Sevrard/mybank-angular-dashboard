import { Routes } from '@angular/router';
import { MainLayout } from './shared/layout/main-layout/main-layout';

import { Login } from './features/auth/login';
import { Signin } from './features/auth/signin';
import { Dashboard } from './features/dashboard/dashboard';
import { Accounts } from './features/accounts/accounts';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      { path: 'login', component: Login },
      { path: 'signin', component: Signin },
      { path: 'dashboard', component: Dashboard , canActivate: [authGuard]},
      { path: 'accounts', component: Accounts ,canActivate: [authGuard]},
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  }
];
