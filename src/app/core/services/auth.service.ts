import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';


@Injectable({ providedIn: 'root' })
export class AuthService {
    
    private apiUrl = environment.apiUrl;

    private readonly TOKEN_KEY = 'access_token';
    private _isAuthenticated = signal<boolean>(!!localStorage.getItem(this.TOKEN_KEY));
    public isAuth = this._isAuthenticated.asReadonly();
    
    constructor(private http: HttpClient,private router: Router) { }

    login(email: string, password: string) {
        return this.http.post<{ token: string, userId:string }>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
            tap(response => {
                localStorage.setItem(this.TOKEN_KEY, response.token);
                localStorage.setItem("userId", response.userId);
                this._isAuthenticated.set(true);
            }),
            catchError(err => {
                console.error('Login error', err);
                return throwError(() => err);
            })
        );
    }
     signin(payload: { firstname: string; lastname: string; email: string; password: string }) {
        return this.http.post<void>(`${this.apiUrl}/users`, payload);   
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