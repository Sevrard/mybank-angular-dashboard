import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  it('should allow access when authenticated', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isAuth: () => true } },
        { provide: Router, useValue: { navigate: () => {} } }
      ]
    });
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );
    expect(result).toBe(true);
  });

  it('should redirect to login when not authenticated', () => {
    const navigateCalls: unknown[] = [];
    const mockRouter = {
      navigate: (url: unknown) => {
        navigateCalls.push(url);
      }
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isAuth: () => false } },
        { provide: Router, useValue: mockRouter }
      ]
    });
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );
    expect(result).toBe(false);
    expect(navigateCalls).toEqual([['/login']]);
  });
});
