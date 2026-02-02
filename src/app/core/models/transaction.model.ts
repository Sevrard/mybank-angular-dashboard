export interface Transaction {
  label: string;
  amount: number;
  type: 'in' | 'out';
  from: string;
  date: string;
  month: string;
}