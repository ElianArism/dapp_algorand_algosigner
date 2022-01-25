export interface PendingTxInformation {
  'pool-error': string;
  txn: Txn2;
}

interface Txn2 {
  sig: string;
  txn: Txn;
}

interface Txn {
  amt: number;
  fee: number;
  fv: number;
  gen: string;
  gh: string;
  lv: number;
  rcv: string;
  snd: string;
  type: string;
}
