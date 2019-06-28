import { Component, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { WalletService } from '../../../../services/wallet.service';
import { HwWalletService } from '../../../../services/hw-wallet.service';
import { ChildHwDialogParams } from '../hw-options-dialog/hw-options-dialog.component';
import { HwDialogBaseComponent } from '../hw-dialog-base.component';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Wallet } from '../../../../app.datatypes';
import { MatSnackBar } from '@angular/material';
import { ChangeNameComponent, ChangeNameData } from '../../../pages/wallets/change-name/change-name.component';
import { showSnackbarError } from '../../../../utils/errors';

enum States {
  Initial,
  Finished,
  Failed,
}

@Component({
  selector: 'app-hw-added-dialog',
  templateUrl: './hw-added-dialog.component.html',
  styleUrls: ['./hw-added-dialog.component.scss'],
})
export class HwAddedDialogComponent extends HwDialogBaseComponent<HwAddedDialogComponent> implements OnDestroy {

  closeIfHwDisconnected = false;

  currentState: States = States.Initial;
  states = States;
  errorMsg = 'hardware-wallet.general.generic-error-internet';
  wallet: Wallet;
  form: FormGroup;

  private initialLabel: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ChildHwDialogParams,
    public dialogRef: MatDialogRef<HwAddedDialogComponent>,
    private walletService: WalletService,
    hwWalletService: HwWalletService,
    private formBuilder: FormBuilder,
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
  ) {
    super(hwWalletService, dialogRef);
    this.operationSubscription = this.walletService.createHardwareWallet().subscribe(wallet => {
      this.walletService.getHwFeaturesAndUpdateData(wallet).subscribe(() => {
        this.wallet = wallet;
        this.initialLabel = wallet.label;

        this.form = this.formBuilder.group({
          label: [wallet.label, Validators.required],
        });

        this.currentState = States.Finished;
        this.data.requestOptionsComponentRefresh();
      });
    }, () => {
      this.currentState = States.Failed;
      this.data.requestOptionsComponentRefresh(this.errorMsg);
    });
  }

  ngOnDestroy() {
    this.snackbar.dismiss();
  }

  saveNameAndCloseModal() {
    if (this.form.value.label === this.initialLabel) {
      this.closeModal();
    } else {
      this.snackbar.dismiss();

      const config = new MatDialogConfig();
      config.width = '400px';
      config.data = new ChangeNameData();
      (config.data as ChangeNameData).wallet = this.wallet;
      (config.data as ChangeNameData).newName = this.form.value.label;
      this.dialog.open(ChangeNameComponent, config).afterClosed().subscribe(result => {
        if (result && !result.errorMsg) {
          this.closeModal();
        } else if (result.errorMsg) {
          showSnackbarError(this.snackbar, result.errorMsg);
        }
      });
    }
  }
}
