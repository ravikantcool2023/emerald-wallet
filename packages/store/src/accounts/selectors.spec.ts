import { Satoshi, Wei, WeiEtc } from '@emeraldpay/bigamount-crypto';
import { AddressSingle } from '@emeraldpay/emerald-vault-core';
import { BlockchainCode, CurrencyAmount } from '@emeraldwallet/core';
import { application } from '../index';
import { SettingsState } from '../settings/types';
import { IState } from '../types';
import { aggregateByAsset, allAsArray, allBalances, balanceByChain, withFiatConversion } from './selectors';
import { moduleName } from './types';

const getAddress: () => AddressSingle = (() => {
  let index = 0;

  return () => {
    const address: AddressSingle = {
      type: 'single',
      value: `0x${index}`,
    };

    index += 1;

    return address;
  };
})();

describe('allAsArray', () => {
  const state = {
    [application.moduleName]: {
      tokens: [],
    },
    [moduleName]: {
      wallets: [
        {
          id: 'f692dcb6-74ea-4583-8ad3-fd13bb6c38ee',
          entries: [],
        },
      ],
    },
  } as unknown as IState;

  it('should returns array', () => {
    const result = allAsArray(state);

    expect(result.length).toEqual(1);
    expect(result[0].id).toEqual('f692dcb6-74ea-4583-8ad3-fd13bb6c38ee');
  });
});

describe('selectTotalBalance', () => {
  it('returns zero if no accounts', () => {
    const state = {
      [application.moduleName]: {
        tokens: [],
      },
      [moduleName]: {
        wallets: [],
      },
    } as unknown as IState;

    const total = balanceByChain(state, BlockchainCode.ETH);

    expect(total).toEqual(Wei.ZERO);
  });

  it('returns account balance if there is only one', () => {
    const state = {
      [moduleName]: {
        wallets: [
          {
            id: 'f692dcb6-74ea-4583-8ad3-fd13bb6c38ee',
            entries: [{ id: 'f692dcb6-74ea-4583-8ad3-fd13bb6c38ee-0', blockchain: 101, address: getAddress() }],
          },
        ],
        details: [{ entryId: 'f692dcb6-74ea-4583-8ad3-fd13bb6c38ee-0', balance: new WeiEtc(1234, 'ETHER').encode() }],
      },
    } as IState;

    const total = balanceByChain(state, BlockchainCode.ETC);

    expect(WeiEtc.is(total)).toBeTruthy();
    expect((total as WeiEtc).toEther()).toBe(1234);
    expect(total.equals(new WeiEtc(1234, 'ETHER'))).toBeTruthy();
  });

  it('returns sum of balances for one wallet', () => {
    const state = {
      [moduleName]: {
        wallets: [
          {
            id: 'f692dcb6-74ea-4583-8ad3-fd13bb6c38ee',
            entries: [
              { id: 'f692dcb6-74ea-4583-8ad3-fd13bb6c38ee-0', blockchain: 100, address: getAddress() },
              { id: 'f692dcb6-74ea-4583-8ad3-fd13bb6c38ee-1', blockchain: 100, address: getAddress() },
              { id: 'f692dcb6-74ea-4583-8ad3-fd13bb6c38ee-2', blockchain: 101, address: getAddress() },
            ],
          },
        ],
        details: [
          { entryId: 'f692dcb6-74ea-4583-8ad3-fd13bb6c38ee-0', balance: new Wei(1234).encode() },
          { entryId: 'f692dcb6-74ea-4583-8ad3-fd13bb6c38ee-1', balance: new Wei(11).encode() },
          { entryId: 'f692dcb6-74ea-4583-8ad3-fd13bb6c38ee-2', balance: new Wei(52).encode() },
        ],
      },
    } as IState;

    const total = balanceByChain(state, BlockchainCode.ETH);

    expect(total.number.toFixed()).toEqual('1245');
  });

  it('returns sum of balances for two wallets', () => {
    const state = {
      [moduleName]: {
        wallets: [
          {
            id: 'f692dcb6-74ea-4583-8ad3-fd13bb6c38ee',
            entries: [
              { id: 'f692dcb6-74ea-4583-8ad3-fd13bb6c38ee-0', blockchain: 100, address: getAddress() },
              { id: 'f692dcb6-74ea-4583-8ad3-fd13bb6c38ee-1', blockchain: 100, address: getAddress() },
              { id: 'f692dcb6-74ea-4583-8ad3-fd13bb6c38ee-2', blockchain: 101, address: getAddress() },
            ],
          },
          {
            id: 'c0659f31-1932-4006-bc4c-dbbab27fc25c',
            entries: [
              { id: 'c0659f31-1932-4006-bc4c-dbbab27fc25c-0', blockchain: 100, address: getAddress() },
              { id: 'c0659f31-1932-4006-bc4c-dbbab27fc25c-1', blockchain: 101, address: getAddress() },
            ],
          },
        ],
        details: [
          { entryId: 'f692dcb6-74ea-4583-8ad3-fd13bb6c38ee-0', balance: new Wei(1234).encode() },
          { entryId: 'f692dcb6-74ea-4583-8ad3-fd13bb6c38ee-1', balance: new Wei(11).encode() },
          { entryId: 'f692dcb6-74ea-4583-8ad3-fd13bb6c38ee-2', balance: new Wei(52).encode() },
          { entryId: 'c0659f31-1932-4006-bc4c-dbbab27fc25c-0', balance: new Wei(200).encode() },
          { entryId: 'c0659f31-1932-4006-bc4c-dbbab27fc25c-1', balance: new Wei(302).encode() },
        ],
      },
    } as IState;

    const total = balanceByChain(state, BlockchainCode.ETH);

    expect(total.number.toFixed()).toEqual('1445');
  });

  it('convert to fiat', () => {
    const state = {
      [application.moduleName]: {
        tokens: [],
      },
      [moduleName]: {
        wallets: [
          {
            id: 'f692dcb6-74ea-4583-8ad3-fd13bb6c38ee',
            entries: [
              { id: 'f692dcb6-74ea-4583-8ad3-fd13bb6c38ee-0', blockchain: 100, address: getAddress() },
              { id: 'f692dcb6-74ea-4583-8ad3-fd13bb6c38ee-1', blockchain: 100, address: getAddress() },
              { id: 'f692dcb6-74ea-4583-8ad3-fd13bb6c38ee-2', blockchain: 101, address: getAddress() },
            ],
          },
          {
            id: 'c0659f31-1932-4006-bc4c-dbbab27fc25c',
            entries: [
              { id: 'c0659f31-1932-4006-bc4c-dbbab27fc25c-0', blockchain: 1, address: getAddress() },
              { id: 'c0659f31-1932-4006-bc4c-dbbab27fc25c-1', blockchain: 100, address: getAddress() },
            ],
          },
        ],
        details: [
          {
            address: '0x0',
            balance: new Wei(1.2, 'ETHER').encode(),
            entryId: 'f692dcb6-74ea-4583-8ad3-fd13bb6c38ee-0',
          },
          {
            address: '0x1',
            balance: new Wei(1.1, 'ETHER').encode(),
            entryId: 'f692dcb6-74ea-4583-8ad3-fd13bb6c38ee-1',
          },
          {
            address: '0x2',
            balance: new WeiEtc(52, 'ETHER').encode(),
            entryId: 'f692dcb6-74ea-4583-8ad3-fd13bb6c38ee-2',
          },
          {
            address: '0x3',
            balance: new Satoshi(0.5, 'BTC').encode(),
            entryId: 'c0659f31-1932-4006-bc4c-dbbab27fc25c-0',
            utxo: [{ value: new Satoshi(0.5, 'BTC').encode() }],
          },
          {
            address: 'bc1',
            balance: new Wei(3, 'ETHER').encode(),
            entryId: 'c0659f31-1932-4006-bc4c-dbbab27fc25c-1',
          },
        ],
      },
      settings: {
        localeCurrency: 'USD',
        rates: {
          BTC: '12300',
          ETH: '256',
          ETC: '4.56',
        },
      } as unknown as SettingsState,
    } as unknown as IState;

    const assets = allBalances(state);

    // wallet 1 - ETH + ETC, wallet 2 - BTC + ETH
    expect(assets.length).toBe(4);

    const aggregatedAssets = aggregateByAsset(assets);

    // ETH + ETC + BTC
    expect(aggregatedAssets.length).toBe(3);

    const prices = withFiatConversion(state, aggregatedAssets);

    console.log(prices);

    expect(prices.length).toBe(3);

    // ETH = (1.2 + 1.1 + 3) * 256
    expect(prices[0].converted?.toString()).toBe(CurrencyAmount.create(1356.8, 'USD').toString());
    // ETC = 52 * 4.56
    expect(prices[1].converted?.toString()).toBe(CurrencyAmount.create(237.12, 'USD').toString());
    // BTC = (0.5) * 12300
    expect(prices[2].converted?.toString()).toBe(CurrencyAmount.create(6150, 'USD').toString());
  });
});
