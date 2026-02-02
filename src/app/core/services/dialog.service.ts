import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog';

@Injectable({ providedIn: 'root' })
export class DialogService {

  constructor(private dialog: MatDialog) { }

  open(data: ConfirmDialogData) {
    return this.dialog.open(ConfirmDialogComponent, {
      width: '360px',
      disableClose: true,
      data
    }).afterClosed();
  }

  success(message: string, title = 'Succès') {
    return this.open({
      title,
      message,
      type: 'success'
    });
  }

  error(message: string, title = 'Erreur') {
    return this.open({
      title,
      message,
      type: 'error'
    });
  }

  info(message: string, title = 'Information') {
    return this.open({
      title,
      message,
      type: 'info'
    });
  }
}
