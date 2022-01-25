import { Component } from '@angular/core';
import { AlgoSignerService } from './services/algosigner.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor(
    private readonly algoSignerService: AlgoSignerService,
    private readonly router: Router
  ) {}

  /**
   * Without transactionParams you can't make transactions
   */
  checkIfTransactionParamsExists() {
    if (this.algoSignerService.TxParams) {
      this.router.navigateByUrl('/transactions');
    } else {
      alert('You need to connect your wallet before.');
    }
  }
}
