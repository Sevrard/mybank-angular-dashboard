import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';

import { Login } from './features/auth/login/login';
import { Dashboard } from './features/dashboard/dashboard';
import { Accounts } from './features/accounts/accounts';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      { path: 'login', component: Login },
      { path: 'dashboard', component: Dashboard },
      { path: 'accounts', component: Accounts },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
