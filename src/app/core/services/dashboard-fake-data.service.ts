import { computed, Injectable, signal } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

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
export class DashboardFakeDataService {

    // ---------------------------
    // ÉTAT (FILTRES)
    // ---------------------------
    readonly period = signal<number>(6);
    readonly month = signal<string | 'ALL'>('ALL');

    setPeriod(period: number) {
        this.period.set(period);
        this.month.set('ALL');
    }
    setMonth(m: string | 'ALL') {
        this.month.set(m);
    }

    // ---------------------------
    // SOURCE DE DONNÉES
    // ---------------------------
    private transactions$ = new BehaviorSubject<Transaction[]>(this.generateYearTransactions());
    private transactions = toSignal(this.transactions$, { initialValue: [] });

    // ---------------------------
    // TRANSACTIONS FILTRÉES
    // ---------------------------

    readonly filteredTransactions = computed(() => {
        const tx = this.transactions();
        const period = this.period();
        const month = this.month();
        if (month !== 'ALL') {
            return tx.filter(t => t.month === month);
        }
        const targetMonths = MONTHS.slice(-period);
        return tx.filter(t => targetMonths.includes(t.month));
    });


    // ---------------------------
    // CASHFLOW (BAR CHART)
    // ---------------------------
    private cashFlow = computed(() => {
        const tx = this.transactions();
        return MONTHS.map(m => {
            const monthly = tx.filter(t => t.month === m);
            return {
                month: m,
                arrival: monthly.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0),
                spending: monthly.filter(t => t.type === 'out').reduce((s, t) => s + Math.abs(t.amount), 0),
            };
        });
    });
    readonly filteredCashFlow = computed(() => {
        const data = this.cashFlow();
        const period = this.period();
        const month = this.month();

        if (month !== 'ALL') {
            return data.filter(d => d.month === month);
        }
        return data.slice(-period);
    });
   

    // ---------------------------
    // KPIs (CALCULÉS)
    // ---------------------------
    readonly income = computed(() =>
        this.filteredTransactions()
            .filter(t => t.type === 'in')
            .reduce((s, t) => s + t.amount, 0)
    );

    readonly expenses = computed(() =>
        this.filteredTransactions()
            .filter(t => t.type === 'out')
            .reduce((s, t) => s + Math.abs(t.amount), 0)
    );

    readonly balance = computed(() => this.income() - this.expenses());

    // ---------------------------
    // DONNÉES STATIQUES
    // ---------------------------
    readonly accounts = [
        { name: 'Compte courant', iban: 'FR76 **** **** 0045', balance: 5200.35 },
        { name: 'Livret A', iban: 'FR76 **** **** 8891', balance: 3000.00 }
    ];
    readonly months = MONTHS;

    // ===========================
    // MOCK DATA GENERATOR
    // ===========================
    private generateYearTransactions(): Transaction[] {
        const result: Transaction[] = [];
        let salary = 2500;

        MONTHS.forEach((month, i) => {
            const bonus = Math.random() > 0.75 ? 200 + Math.random() * 300 : 0;

            // Dépenses spécifiques
            if (month === "Mar") result.push({ label: 'Immobilier', amount: -6000, type: 'out', from: 'Guimmo', date: `25/${i + 1}/2025`, month });
            if (month === "Jun") result.push({ label: 'Voiture', amount: -3000, type: 'out', from: 'Citroen', date: `25/${i + 1}/2025`, month });
            if (month === "Aug") {
                result.push({ label: 'Loisir', amount: -2500, type: 'out', from: 'Airfrance', date: `25/${i + 1}/2025`, month });
                result.push({ label: 'Loisir', amount: -1500, type: 'out', from: 'Hotel-L', date: `25/${i + 1}/2025`, month });
            }
            if (month === "Dec") {
                result.push({ label: 'Impot', amount: -2500, type: 'out', from: 'Impot.gouv', date: `25/${i + 1}/2025`, month });
                result.push({ label: 'Loisir', amount: -1000, type: 'out', from: 'Cadeaux', date: `25/${i + 1}/2025`, month });
            }

            // Revenus et charges fixes
            result.push({ label: bonus ? 'Salaire + Bonus' : 'Salaire', amount: salary + bonus, type: 'in', from: 'Entreprise ABC SAS', date: `25/${i + 1}/2025`, month });
            result.push({ label: 'Loyer', amount: -750, type: 'out', from: 'Agence Immobilière Dupont', date: `03/${i + 1}/2025`, month });
            result.push({ label: 'Courses', amount: -(120 + Math.random() * 200), type: 'out', from: 'Supermarché', date: `12/${i + 1}/2025`, month });

            const electricity = i >= 10 || i <= 2 ? 90 + Math.random() * 40 : 60 + Math.random() * 20;
            result.push({ label: 'Charges', amount: -electricity, type: 'out', from: 'EDF', date: `15/${i + 1}/2025`, month });
            result.push({ label: 'Loisir', amount: -15.99, type: 'out', from: 'Loisir', date: `18/${i + 1}/2025`, month });

            if (Math.random() > 0.4) {
                result.push({ label: 'Loisir', amount: -(30 + Math.random() * 70), type: 'out', from: 'Divers', date: `22/${i + 1}/2025`, month });
            }
        });

        return result;
    }
}