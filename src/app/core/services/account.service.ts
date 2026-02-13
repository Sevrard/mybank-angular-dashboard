import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, switchMap, tap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop'; 
import { environment } from '../../../environments/environment';


@Injectable({ providedIn: 'root' })
export class AccountService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private readonly API_URL = this.apiUrl+'/accounts';
  
  private refresh$ = new BehaviorSubject<void>(undefined);

  public accounts = toSignal(
    this.refresh$.pipe(
      switchMap(() => {
        const userId = localStorage.getItem('userId');
        return this.http.get<any[]>(`${this.API_URL}/user/${userId}`);
      })
    ),
    { initialValue: [] } 
  );

  refreshAccounts() {
    this.refresh$.next();
  }

  createAccount(payload: any): Observable<void> {
    return this.http.post<void>(this.API_URL, payload).pipe(
      tap(() => this.refreshAccounts()) 
    );
  }

  deleteAccount(id: string): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/deactivate/${id}`, {}).pipe(
      tap(() => this.refreshAccounts()) 
    );
  }
}