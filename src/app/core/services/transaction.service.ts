import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private http = inject(HttpClient);

  private apiUrl = environment.apiUrl;
  private readonly API_URL = this.apiUrl + "/transfers";

  createTransaction(transaction: any) {
    return this.http.post(this.API_URL, transaction);
  }
}