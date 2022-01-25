export interface SuggestedTxParams {
  flatFee?: boolean | undefined;
  fee: number;
  firstRound: number;
  lastRound: number;
  genesisID: string;
  genesisHash: string;
}
