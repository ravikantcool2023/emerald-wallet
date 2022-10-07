import { BigAmount, CreateAmount, Unit, Units } from '@emeraldpay/bigamount';
import { Satoshi, Wei, WeiEtc } from '@emeraldpay/bigamount-crypto';
import { WeiAny } from '@emeraldpay/bigamount-crypto/lib/ethereum';
import { LedgerApp } from '@emeraldpay/emerald-vault-core';
import { Bitcoin } from './bitcoin';
import { CoinTicker } from './CoinTicker';
import Ethereum from './ethereum/Ethereum';
import EthereumParams from './ethereum/EthereumParams';
import { HDPath } from './hdpath';
import { IBlockchain } from './IBlockchain';

export enum BlockchainCode {
  // Mainnet
  BTC = 'btc',
  ETC = 'etc',
  ETH = 'eth',
  // Testnet
  Goerli = 'goerli',
  TestBTC = 'testbtc',
  // Other
  Unknown = 'unknown',
}

export const Blockchains: { [key: string]: IBlockchain } = {
  [BlockchainCode.ETH]: new Ethereum(
    new EthereumParams(BlockchainCode.ETH, CoinTicker.ETH, 1, HDPath.default().forCoin(BlockchainCode.ETH), 12, true),
    'Ethereum',
    ['DAI', 'USDC', 'USDT', 'WETH'],
  ),
  [BlockchainCode.ETC]: new Ethereum(
    new EthereumParams(BlockchainCode.ETC, CoinTicker.ETC, 61, HDPath.default().forCoin(BlockchainCode.ETC), 250),
    'Ethereum Classic',
    [],
  ),
  [BlockchainCode.Goerli]: new Ethereum(
    new EthereumParams(
      BlockchainCode.Goerli,
      CoinTicker.ETG,
      5,
      HDPath.default().forCoin(BlockchainCode.ETH).forAccount(160720),
      100,
      true,
    ),
    'Ethereum Goerli Testnet',
    ['WEENUS', 'WETH', 'WETG'],
  ),
  [BlockchainCode.BTC]: new Bitcoin({
    chainId: 0,
    code: BlockchainCode.BTC,
    coinTicker: CoinTicker.BTC,
    decimals: 8,
    hdPath: HDPath.default().forPurpose(84),
    confirmations: 3,
  }),
  [BlockchainCode.TestBTC]: new Bitcoin({
    chainId: 0,
    code: BlockchainCode.TestBTC,
    coinTicker: CoinTicker.TESTBTC,
    decimals: 8,
    hdPath: HDPath.default().forPurpose(84).forCoin(1),
    confirmations: 10,
  }),
};

const allCodes = [
  BlockchainCode.BTC,
  BlockchainCode.ETC,
  BlockchainCode.ETH,
  BlockchainCode.Goerli,
  BlockchainCode.TestBTC,
];

const allChains = allCodes.map((code) => Blockchains[code]);

export function isValidChain(code: BlockchainCode): boolean {
  return Blockchains[code] != null;
}

export function blockchainCodeByName(name: string): string {
  if (!name) {
    throw new Error('Empty chain name passed');
  }
  const cleanName = name.toLowerCase();
  return allCodes.find((code) => code === cleanName) || BlockchainCode.Unknown;
}

export function blockchainByName(name: string): IBlockchain {
  const code = blockchainCodeByName(name);
  if (!Blockchains[code]) {
    throw new Error(`Unsupported chain: ${code}`);
  }
  return Blockchains[code];
}

export function ethereumByChainId(id?: number): IBlockchain | undefined {
  if (typeof id === 'undefined') {
    return undefined;
  }
  return allChains.find((chain) => chain.params.chainId === id);
}

export function blockchainIdToCode(id: number): BlockchainCode {
  switch (id) {
    case 1:
      return BlockchainCode.BTC;
    case 100:
      return BlockchainCode.ETH;
    case 101:
      return BlockchainCode.ETC;
    case 10003:
      return BlockchainCode.TestBTC;
    case 10005:
      return BlockchainCode.Goerli;
    default:
      throw Error('Unsupported blockchain id: ' + id);
  }
}

export function blockchainById(id: number): IBlockchain | undefined {
  return Blockchains[blockchainIdToCode(id)];
}

export function blockchainCodeToId(code: BlockchainCode): number {
  switch (code) {
    case BlockchainCode.BTC:
      return 1;
    case BlockchainCode.ETH:
      return 100;
    case BlockchainCode.ETC:
      return 101;
    case BlockchainCode.TestBTC:
      return 10003;
    case BlockchainCode.Goerli:
      return 10005;
    default:
      throw Error('Unsupported blockchain: ' + code);
  }
}

export function isEthereum(code: BlockchainCode): boolean {
  return code === BlockchainCode.ETH || code === BlockchainCode.ETC || code === BlockchainCode.Goerli;
}

export function isBitcoin(code: BlockchainCode): boolean {
  return code == BlockchainCode.BTC || code == BlockchainCode.TestBTC;
}

export const WEIS_GOERLI = new Units([
  new Unit(0, 'Goerli Wei', 'WeiG'),
  new Unit(9, 'Goerli Gwei', 'GWeiG'),
  new Unit(18, 'Goerli Ether', 'ETG'),
]);

export const SATOSHIS_TEST = new Units([new Unit(0, 'Test Satoshi', 'tsat'), new Unit(8, 'Test Bitcoin', 'TBTC')]);

export function amountFactory(code: BlockchainCode): CreateAmount<BigAmount> {
  switch (code) {
    case BlockchainCode.BTC:
      return Satoshi.factory();
    case BlockchainCode.ETC:
      return WeiEtc.factory();
    case BlockchainCode.ETH:
      return Wei.factory();
    case BlockchainCode.Goerli:
      return (value) => new WeiAny(value, WEIS_GOERLI);
    case BlockchainCode.TestBTC:
      return (value) => new BigAmount(value, SATOSHIS_TEST);
    default:
      throw new Error(`Unsupported blockchain: ${code}`);
  }
}

export function amountDecoder<T extends BigAmount>(code: BlockchainCode): (n: string) => T {
  const factory = amountFactory(code) as CreateAmount<T>;

  const { units } = factory(0);

  return (n) => BigAmount.decodeFor(n, units, factory);
}

export const ledgerByBlockchain: Record<LedgerApp, BlockchainCode> = {
  bitcoin: BlockchainCode.BTC,
  'bitcoin-testnet': BlockchainCode.TestBTC,
  ethereum: BlockchainCode.ETH,
  'ethereum-classic': BlockchainCode.ETC,
};
