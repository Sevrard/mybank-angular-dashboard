import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';


@Injectable({ providedIn: 'root' })
export class AuthService {
    
    private readonly API = 'http://localhost:8080';
    private readonly TOKEN_KEY = 'access_token';
    private _isAuthenticated = signal<boolean>(!!localStorage.getItem(this.TOKEN_KEY));
    public isAuth = this._isAuthenticated.asReadonly();
    
    constructor(private http: HttpClient,private router: Router) { }

    login(email: string, password: string) {
        return this.http.post<{ token: string }>(`${this.API}/auth/login`, { email, password }).pipe(
            tap(response => {
                localStorage.setItem(this.TOKEN_KEY, response.token);
                this._isAuthenticated.set(true);
            }),
            catchError(err => {
                console.error('Login error', err);
                return throwError(() => err);
            })
        );
    }
     signin(payload: { firstname: string; lastname: string; email: string; password: string }) {
        return this.http.post<void>(`${this.API}/users`, payload);   
     }

    logout() {
        localStorage.removeItem(this.TOKEN_KEY);
        this._isAuthenticated.set(false);
        this.router.navigate(['/login']);
        //this.http.post(`${this.API}/auth/logout`, {}, { withCredentials: true }).subscribe();
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }
     isAuthenticated(){
        return this.isAuth;
    }
}