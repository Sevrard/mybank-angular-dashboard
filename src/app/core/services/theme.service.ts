import { effect, Injectable, signal } from '@angular/core';

export interface AppTheme {
  name: string;
  displayName: string;
  isDark: boolean;
  colors: {
    primary: string;
    accent: string;
  };
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly availableThemes: AppTheme[] = [
    { 
      name: 'theme-pink-bluegrey', 
      displayName: 'Pink & Blue Grey', 
      isDark: false,
      colors: { primary: '#e91e63', accent: '#607d8b' } 
    },
    { 
      name: 'theme-purple-green', 
      displayName: 'Purple & Green', 
      isDark: false,
      colors: { primary: '#9c27b0', accent: '#4caf50' }
    },
    { 
      name: 'theme-indigo-pink', 
      displayName: 'Indigo & Pink', 
      isDark: true,
      colors: { primary: '#3f51b5', accent: '#ff4081' }
    },
    { 
      name: 'theme-deeppurple-amber', 
      displayName: 'Deep Purple & Amber', 
      isDark: true,
      colors: { primary: '#673ab7', accent: '#ffc107' }
    },
  ];
  activeTheme = signal<AppTheme>(this.getInitialTheme());

  constructor() {
    effect(() => {
      const theme = this.activeTheme();
      this.availableThemes.forEach(t => document.body.classList.remove(t.name));
      document.body.classList.add(theme.name);
      localStorage.setItem('app-theme', theme.name);
    });
  }
  
  setTheme(themeName: string) {
    const theme = this.availableThemes.find(t => t.name === themeName);
    if (theme) this.activeTheme.set(theme);
  }

  private getInitialTheme(): AppTheme {
    const saved = localStorage.getItem('app-theme');
    const found = this.availableThemes.find(t => t.name === saved);
    if (found) return found;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark 
      ? this.availableThemes.find(t => t.name === 'theme-indigo-pink')! 
      : this.availableThemes.find(t => t.name === 'theme-pink-bluegrey')!;
  }

}