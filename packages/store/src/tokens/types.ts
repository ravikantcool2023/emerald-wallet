import { BlockchainCode, PersistentState, TokenData } from '@emeraldwallet/core';

export const moduleName = 'tokens';

export interface TokenBalance {
  decimals: number;
  symbol: string;
  unitsValue: string;
}

export type TokensState = {
  [blockchain in BlockchainCode]?: {
    [address: string]: {
      [contractAddress: string]: TokenBalance;
    };
  };
};

export enum ActionTypes {
  INIT_STATE = 'TOKEN/INIT_STATE',
  SET_TOKEN_BALANCE = 'TOKENS/SET_TOKEN_BALANCE',
}

export interface InitTokenStateAction {
  type: ActionTypes.INIT_STATE;
  payload: {
    balances: PersistentState.Balance[];
    tokens: TokenData[];
  };
}

export interface SetTokenBalanceAction {
  type: ActionTypes.SET_TOKEN_BALANCE;
  payload: {
    address: string;
    blockchain: BlockchainCode;
    balance: TokenBalance;
    contractAddress: string;
  };
}

export type TokensAction = InitTokenStateAction | SetTokenBalanceAction;
