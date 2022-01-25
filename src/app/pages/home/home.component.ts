import { Component, OnInit } from '@angular/core';
import { Account } from '../../interfaces/account.interface';
import { AlgoSignerService } from '../../services/algosigner.service';
import { SuggestedTxParams } from '../../interfaces/suggested-tx-params.interface';
import { HttpResponse } from '../../interfaces/http-response.interface';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  accounts!: Account[];
  alert!: HTMLDivElement | null;
  isConnected!: boolean;
  showAlert: { ok: boolean; message: string; style: string } = {
    ok: false,
    message: '',
    style: '',
  };
  showSpinner!: boolean;
  txParams!: SuggestedTxParams | null;

  constructor(private readonly algoSignerService: AlgoSignerService) {}

  ngOnInit(): void {
    this.showSpinner = true;
  }
  /**
   * Connect AlgoSigner
   */
  connect(): void {
    try {
      this.algoSignerService.connectToAlgoSigner().subscribe({
        next: (res) => this.checkResponse(res),
        error: (err) => {
          this.showAlert.style = 'alert w-75 mx-auto alert-danger';
          this.showAlert.ok = true;
          this.showAlert.message = err.message || 'Error';
        },
      });
    } catch (err: any) {
      this.showAlert.style = 'alert w-75 mx-auto alert-danger';
      this.showAlert.ok = true;
      this.showAlert.message =
        err.message +
          '. Please check if you have the AlgoSigner Extension Installed' ||
        'Error';
    }
  }
  /**
   * Check if connection was successfull
   */
  checkResponse(response: HttpResponse<{}>): void {
    this.showAlert.message = response.err?.errMessage || 'Connected';
    this.showAlert.ok = true;
    if (response.ok) {
      this.showAlert.style = 'alert w-75 mx-auto alert-success';
      this.isConnected = true;
    } else {
      this.showAlert.style = 'alert w-75 mx-auto alert-danger';
    }
    this.setupSDK();
  }
  /**
   * Setup AlgoSigner SDK
   */
  private setupSDK(): void {
    this.algoSignerService.setupAlgoSignerSDK().subscribe({
      next: async (res) => {
        if (res.ok) {
          await this.getTxParams('init');
          this.showAlert.message = 'SDK Setup done!';
          this.showSpinner = false;
        } else {
          this.showAlert.message = 'SDK Setup fail! \n' + res.err?.errMessage;
        }
        this.showAlert.ok = true;
      },
      error: console.log,
    });
  }
  /**
   * Show AlgoSigner handled accounts
   */
  showAccounts(): void {
    this.algoSignerService.getTestNetAccounts().subscribe({
      next: (res: HttpResponse<Account[]>) => {
        if (res.ok && res.data?.length) {
          this.accounts = res.data;
        } else {
          this.showAlert.message = res.err?.errMessage || 'API error';
          this.showAlert.ok = true;
        }
      },
      error: (err) => console.log(err),
    });
  }
  /**
   * Show Tx Params and set it into AlgoSigner Service
   */
  async getTxParams(origin: string): Promise<void> {
    try {
      const res = await lastValueFrom(this.algoSignerService.getTxParams());
      if (res.ok && res.data && origin === 'init') {
        console.log('params obtained');
      } else if (res.ok && res.data && origin === 'click') {
        this.txParams = res.data;
      } else {
        this.showAlert.message = res.err?.errMessage || 'API error';
        this.showAlert.ok = true;
      }
    } catch (error) {
      console.log(error);
    }
  }
  hideAccounts(): void {
    this.accounts = [];
  }
  clearAlert(): void {
    this.showAlert.message = '';
    this.showAlert.style = '';
    this.showAlert.ok = false;
  }
  clearTable(): void {
    this.txParams = null;
  }
}
