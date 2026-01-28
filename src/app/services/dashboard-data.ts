import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, of } from 'rxjs';
import { MonthlyCashFlow } from '../shared/components/bar-chart/bar-chart';

export interface Transaction {
  label: string;
  amount: number;
  type: 'in' | 'out';
  from: string;
  date: string;
  month: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];


@Injectable({ providedIn: 'root' })
export class DashboardDataService {

  
  private period$ = new BehaviorSubject<number>(6);
  private month$ = new BehaviorSubject<string | 'ALL'>('ALL');

  setPeriod(months: number) {
    this.period$.next(months);
  }
  setMonth(month: string | 'ALL') {
    this.month$.next(month);
  }

  readonly periodValue$ = this.period$.asObservable();
  readonly monthValue$ = this.month$.asObservable();

  // ---------------------------
  // SOURCE OF TRUTH
  // ---------------------------
  private transactions$ = new BehaviorSubject<Transaction[]>(
    this.generateYearTransactions()
  );

  // ---------------------------
  // FILTERED TRANSACTIONS
  // ---------------------------
filteredTransactions$ = combineLatest([
  this.transactions$,
  this.period$,
  this.month$
]).pipe(
  map(([tx, period, month]) => {
    let filtered = [...tx];
    //filtre par mois (si applicable)
    if (month !== 'ALL') {
      filtered = filtered.filter(t => t.month === month);
    }
    //filtre par période (après)
    const maxItems = period * 3;
    return filtered.slice(-maxItems);
  })
);


  // ---------------------------
  // CASHFLOW (BAR CHART)
  // ---------------------------
  cashFlow$ = this.transactions$.pipe(
    map(tx => {
      return MONTHS.map(month => {
        const monthly = tx.filter(t => t.month === month);
        return {
          month,
          arrival: monthly
            .filter(t => t.type === 'in')
            .reduce((s, t) => s + t.amount, 0),
          spending: monthly
            .filter(t => t.type === 'out')
            .reduce((s, t) => s + Math.abs(t.amount), 0),
        };
      });
    })
  );

 filteredCashFlow$ = combineLatest([
  this.cashFlow$,
  this.period$,
  this.month$
]).pipe(
  map(([data, period, month]) => {
    let filtered = [...data];
    if (month !== 'ALL') {
      filtered = filtered.filter(d => d.month === month);
    }
    if (month === 'ALL') {
      filtered = filtered.slice(-period);
    }
    return filtered;
  })
);



  // ---------------------------
  // KPI
  // ---------------------------
  income$ = this.filteredTransactions$.pipe(
    map(tx => tx
      .filter(t => t.type === 'in')
      .reduce((s, t) => s + t.amount, 0)
    )
  );

  expenses$ = this.filteredTransactions$.pipe(
    map(tx => tx
      .filter(t => t.type === 'out')
      .reduce((s, t) => s + Math.abs(t.amount), 0)
    )
  );

  balance$ = combineLatest([this.income$, this.expenses$]).pipe(
    map(([i, e]) => i - e)
  );

  // ---------------------------
  // ACCOUNTS (STATIC FOR NOW)
  // ---------------------------
  accounts$ = of([
    { name: 'Compte courant', iban: 'FR76 **** **** 0045', balance: 5200.35 },
    { name: 'Livret A', iban: 'FR76 **** **** 8891', balance: 3000.00 }
  ]);
  months$ = of(MONTHS);


  // ===========================
  // MOCK DATA GENERATOR
  // ===========================
  private generateYearTransactions(): Transaction[] {
    const result: Transaction[] = [];
    let salary = 2800;

    MONTHS.forEach((month, i) => {

      // --- Salary (avec petits bonus irréguliers)
      const bonus = Math.random() > 0.75 ? 200 + Math.random() * 300 : 0;

      if(month=== "Mar"){
        result.push({
          label: 'Immobilier',
          amount: -1500,
          type: 'out',
          from: 'Guimmo',
          date: `25/${i + 1}/2025`,
          month
        });
      } 
       if(month=== "Jun"){
        result.push({
          label: 'Voiture',
          amount: -5000,
          type: 'out',
          from: 'Citroen',
          date: `25/${i + 1}/2025`,
          month
        });
      } 
      if(month=== "Aug"){
        result.push({
          label: 'Voyage',
          amount: -2500,
          type: 'out',
          from: 'Airfrance',
          date: `25/${i + 1}/2025`,
          month
        });
         result.push({
          label: 'Voyage',
          amount: -500,
          type: 'out',
          from: 'Hotel-L',
          date: `25/${i + 1}/2025`,
          month
        });
      } 
      if(month=== "Dec"){
        result.push({
          label: 'Impot',
          amount: -2500,
          type: 'out',
          from: 'Impot.gouv',
          date: `25/${i + 1}/2025`,
          month
        });
        result.push({
          label: 'Noel',
          amount: -1000,
          type: 'out',
          from: 'Entreprise ABC SAS',
          date: `25/${i + 1}/2025`,
          month
        });
      } 
      result.push({
        label: bonus ? 'Salaire + Bonus' : 'Salaire',
        amount: salary + bonus,
        type: 'in',
        from: 'Entreprise ABC SAS',
        date: `25/${i + 1}/2025`,
        month
      });

      // --- Rent (stable)
      result.push({
        label: 'Loyer',
        amount: -950,
        type: 'out',
        from: 'Agence Immobilière Dupont',
        date: `03/${i + 1}/2025`,
        month
      });

      // --- Groceries (très variable)
      result.push({
        label: 'Courses',
        amount: -(120 + Math.random() * 120),
        type: 'out',
        from: 'Supermarché',
        date: `12/${i + 1}/2025`,
        month
      });

      // --- Utilities (saisonnalité)
      const electricity =
        i >= 10 || i <= 2
          ? 90 + Math.random() * 40   // hiver
          : 60 + Math.random() * 20;  // été

      result.push({
        label: 'Électricité',
        amount: -electricity,
        type: 'out',
        from: 'EDF',
        date: `15/${i + 1}/2025`,
        month
      });

      // --- Subscriptions
      result.push({
        label: 'Netflix',
        amount: -15.99,
        type: 'out',
        from: 'Netflix',
        date: `18/${i + 1}/2025`,
        month
      });

      // --- Loisirs / sorties
      if (Math.random() > 0.4) {
        result.push({
          label: 'Restaurant / Loisirs',
          amount: -(30 + Math.random() * 70),
          type: 'out',
          from: 'Divers',
          date: `22/${i + 1}/2025`,
          month
        });
      }

      // --- Dépense exceptionnelle (1–2 fois/an)
      if (Math.random() > 0.9) {
        result.push({
          label: 'Dépense exceptionnelle',
          amount: -(400 + Math.random() * 600),
          type: 'out',
          from: 'Exceptionnel',
          date: `28/${i + 1}/2025`,
          month
        });
      }
    });

    return result;
  }

}
