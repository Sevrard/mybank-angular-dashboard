import { Component, computed, effect, inject, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { DashboardFakeDataService } from '../../core/services/dashboard-fake-data.service';
import { PolarChart } from '../../shared/components/polar-chart/polar-chart';
import { MatDialog } from '@angular/material/dialog';
import { ModalContainer } from '../../shared/components/modal/modal';
import { AccountService } from '../../core/services/account.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, PolarChart],
  templateUrl: './accounts.html',
  styleUrls: ['./accounts.scss']
})
export class Accounts implements OnInit {
  private dialog = inject(MatDialog);
  public dataService = inject(DashboardFakeDataService);
  public accountService = inject(AccountService);

  accounts = this.accountService.accounts;

  ngOnInit(): void {
    this.dataService.setPeriod(12);
    this.accountService.refreshAccounts();
  }
  constructor() {
    effect(() => {
      console.log('Les données ont changé :', this.accounts());
    });
  }

  onDeleteAccount(id: string) {
    console.log(id);
  if (confirm('Voulez-vous vraiment supprimer ce compte ?')) {
    this.accountService.deleteAccount(id).subscribe({
      next: () => {},
      error: (err) => console.error('Erreur lors de la suppression', err)
    });
  }
}

  polarData = computed(() => {
    const tx = this.dataService.filteredTransactions();
    const categories: Record<string, number> = {};

    tx.filter((t: { type: string; }) => t.type === 'out').forEach(t => {
      const cat = t.label.split(' ')[0]; 
      categories[cat] = (categories[cat] || 0) + Math.abs(t.amount);
    });

    return {
      labels: Object.keys(categories),
      values: Object.values(categories)
    };
  });

  openModal(type: 'add' | 'debit' | 'credit', accountId:any) {
    const config = {
      add: { title: 'Ajouter un compte', type: 'add' },
      debit: { title: 'Envoyer de l\'argent', type: 'debit', accountId }, 
      credit: { title: 'Alimenter mon compte', type: 'credit', accountId }
    };

    const dialogRef =this.dialog.open(ModalContainer, {
      width: '500px',
      maxWidth: '90vw',
      panelClass: 'custom-bank-modal', 
      data: config[type],
    });
   
    dialogRef.afterClosed().subscribe(result => {
    if (result === true) { 
      this.accountService.refreshAccounts();
    }
  });
  }
}