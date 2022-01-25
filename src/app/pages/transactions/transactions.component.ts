import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlgoSignerService } from '../../services/algosigner.service';
import { TransactionSignature } from '../../interfaces/transaction-signature.interface';
import { tap } from 'rxjs';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss'],
})
export class TransactionsComponent implements OnInit {
  message!: string;
  transaction!: any;
  transactionForm!: FormGroup;
  txEnabledToCheck!: boolean;
  txSuccess!: boolean;
  txWasSent!: boolean;

  constructor(
    private readonly fb: FormBuilder,
    private readonly algoSignerService: AlgoSignerService
  ) {}

  ngOnInit(): void {
    this.transactionForm = this.fb.group({
      from: [
        'MALVCNPYFAS5MN7R6DAO3BRORKMRYOWAVZWDPQ6XBEBXQ2GDFFA75E6S5M',
        Validators.required,
      ],
      to: [
        'EX3L3OW2EOCHDJCUX3XDGDIQQZFVNOSSRVCG4ZK73VLZNZ2EO4ZBT2HE6U',
        Validators.required,
      ],
      amount: ['', Validators.required],
      note: [''],
    });
  }
  realizeTransaction(): void {
    this.txEnabledToCheck = false;
    const tx: TransactionSignature = this.transactionForm.value;
    tx.amount = Number(tx.amount);
    this.algoSignerService
      .SignPayTransaction(tx)
      .pipe(tap(() => (this.txWasSent = true)))
      .subscribe({
        next: (res) => {
          if (res.ok) {
            this.txSuccess = true;
            this.message = 'Your transaction was send!';
            this.txEnabledToCheck = true;
          } else {
            this.txSuccess = false;
            this.message = `${res.err?.errMessage}`;
            console.log(res.err?.logs);
          }
        },
        error: (err) => {
          this.txWasSent = true;
          this.txSuccess = false;
          this.message = err.message || 'Error';
        },
      });
  }
  checkTransactionStatus() {
    this.algoSignerService.checkPendingTransaction().subscribe((res) => {
      if (!res.ok) {
        this.txSuccess = false;
        this.message = res.err?.errMessage || 'Error';
        return;
      }
      this.txSuccess = true;
      this.transaction = JSON.stringify(res.data, null, 4);
    });
  }
  clearAlert(): void {
    this.txWasSent = false;
    this.message = '';
  }
  clearTxStatus(): void {
    this.transaction = null;
  }
}
