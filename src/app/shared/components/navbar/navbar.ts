import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

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
}
