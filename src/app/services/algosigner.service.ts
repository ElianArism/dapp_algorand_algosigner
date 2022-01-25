import { Injectable } from '@angular/core';
import algosdk from 'algosdk';
import {
  catchError,
  from,
  map,
  mapTo,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { environment } from '../../environments/environment';
import { HttpResponse } from '../interfaces/http-response.interface';
import { Account } from '../interfaces/account.interface';
import { SuggestedTxParams } from '../interfaces/suggested-tx-params.interface';
import { TransactionSignature } from '../interfaces/transaction-signature.interface';
import PendingTransactionInformation from 'algosdk/dist/types/src/client/v2/algod/pendingTransactionInformation';

declare const AlgoSigner: any;

@Injectable({
  providedIn: 'root',
})
export class AlgoSignerService {
  private algoClient!: algosdk.Algodv2;
  private indexerClient!: algosdk.Indexer;
  private txParams!: SuggestedTxParams;
  private currentTxId!: string;
  constructor() {}

  get TxParams(): SuggestedTxParams {
    return this.txParams;
  }
  /**
   * Connect to AlgoSigner
   * @returns Observable<{}> | err
   */
  connectToAlgoSigner(): Observable<HttpResponse<{}>> {
    console.log('Connecting with AlgoSigner...');
    return from(AlgoSigner.connect()).pipe(
      mapTo<HttpResponse<{}>>(<HttpResponse<{}>>{
        ok: true,
        data: {},
      }),
      catchError((err) =>
        of({
          ok: false,
          err: { errMessage: err.message, logs: err },
        })
      )
    );
  }
  /**
   * Setup client for algosdk
   * @returns Observable<{}> | err
   */
  setupAlgoSignerSDK(): Observable<HttpResponse<{}>> {
    console.log('Setup SDK in process...');

    const { token, algorandSv, indexerSv, algorandPort } = environment;
    const apiKey = { 'X-API-Key': token };
    this.algoClient = new algosdk.Algodv2(apiKey, algorandSv, algorandPort);
    this.indexerClient = new algosdk.Indexer(apiKey, indexerSv, algorandPort);

    return from(this.algoClient.healthCheck().do()).pipe(
      mapTo<HttpResponse<{}>>(<HttpResponse<{}>>{
        ok: true,
        data: {},
      }),
      catchError((err) =>
        of({
          ok: false,
          err: { errMessage: err.message, logs: err },
        })
      )
    );
  }
  /**
   * Gets the users TestNet accounts
   * @returns Observable<HttpResponse<Account[]>>
   */
  getTestNetAccounts(): Observable<HttpResponse<Account[]>> {
    return from(
      <Promise<Account[]>>AlgoSigner.accounts({
        ledger: environment.ledger,
      })
    ).pipe(
      map<Account[], HttpResponse<Account[]>>((res: Account[]) => ({
        ok: true,
        data: res,
      })),
      catchError((err: any) =>
        of({
          ok: false,
          err: { errMessage: err.message, logs: err },
        })
      )
    );
  }
  /**
   * Query AlgoD to get TestNet suggested Transaction Params
   * @returns <Observable<HttpResponse<SuggestedTxParams>>>
   */
  getTxParams(): Observable<HttpResponse<SuggestedTxParams>> {
    return from(this.algoClient.getTransactionParams().do()).pipe(
      map((res: SuggestedTxParams) => ({
        ok: true,
        data: res,
      })),
      tap((res) => {
        if (res.data) this.txParams = res.data;
      }),
      catchError((err: any) =>
        of({
          ok: false,
          err: { errMessage: err.message, logs: err },
        })
      )
    );
  }
  /**
   * Ask the user to sign a payment transaction using AlgoSigner's Sign method
   * @param {TransactionSignature} transaction
   * @returns Observable<HttpResponse<{ txId: string }>>
   */
  SignPayTransaction(
    transaction: TransactionSignature
  ): Observable<HttpResponse<{ txId: string }>> {
    try {
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        ...transaction,
        note: new TextEncoder().encode(transaction.note || 'test'),
        amount: algosdk.algosToMicroalgos(transaction.amount),
        suggestedParams: this.txParams,
      });
      // Use the AlgoSigner encoding library to make the transactions base64
      const txn_b64 = AlgoSigner.encoding.msgpackToBase64(txn.toByte());
      return from(AlgoSigner.signTxn([{ txn: txn_b64 }])).pipe(
        switchMap((res: any) => {
          return this.sendSignedTransaction({
            tx: res[0].blob,
            ledger: environment.ledger,
          });
        }),
        catchError((err: any) =>
          of({
            ok: false,
            err: { errMessage: err.message, logs: err },
          })
        )
      );
    } catch (err: any) {
      return of({
        ok: false,
        err: {
          errMessage:
            err?.message + ' Connect your wallet and try again' ||
            'Error, check the console',
          logs: err,
        },
      });
    }
  }
  /**
   * Send Signed Transaction and returns his tx id
   * @param {{ ledger: string, tx: Blob}} txInfo
   * @returns Observable<HttpResponse<{ txId: string }>>
   */
  private sendSignedTransaction(txInfo: {
    ledger: string;
    tx: Blob;
  }): Observable<HttpResponse<{ txId: string }>> {
    return from(AlgoSigner.send(txInfo)).pipe(
      map((res) => {
        this.currentTxId = (res as { txId: string }).txId;
        return { ok: true, data: res as { txId: string } };
      }),
      catchError((err) =>
        of({ ok: false, err: { errMessage: err.message, logs: err } })
      )
    );
  }
  /**
   * Checks the pending transaction using the stored tx id in
   * the property this.currentTxId
   * @returns Observable<HttpResponse<PendingTransactionInformation>>
   */
  checkPendingTransaction(): Observable<
    HttpResponse<PendingTransactionInformation>
  > {
    return from(
      this.algoClient.pendingTransactionInformation(this.currentTxId).do()
    ).pipe(
      map((response) => ({
        ok: true,
        data: response as PendingTransactionInformation,
      })),
      catchError((err) =>
        of({ ok: false, err: { errMessage: err.message, logs: err } })
      )
    );
  }
}
