import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/transfers';

  createTransaction(transaction: any) {
    return this.http.post(this.API_URL, transaction);
  }
}