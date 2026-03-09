import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { DialogService } from '../../../core/services/dialog.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule,MatToolbarModule,MatButtonModule,MatIconModule,MatMenuModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})

export class Navbar {
  public authService = inject(AuthService);
  public themeService = inject(ThemeService);
  private router = inject(Router);
  private dialog = inject(DialogService);

  loginDemo() {
    this.authService.login('demo@bank.com', 'azerty').subscribe({
      next: () => {
        this.dialog.success('Connexion au compte démo réussie 🎉');
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.dialog.error('Impossible de se connecter au compte démo');
      }
    });
  }
}
