import { IpcCommands, Logger, SettingsOptions, TokenData, Versions, WalletApi } from '@emeraldwallet/core';
import {
  BackendApiInvoker,
  RemoteAddressBook,
  RemoteBalances,
  RemoteCache,
  RemoteTxHistory,
  RemoteTxMeta,
  RemoteVault,
  RemoteXPubPosition,
  accounts,
  addressBook,
  application,
  createStore,
  screen,
  settings,
  triggers,
} from '@emeraldwallet/store';
import { ipcRenderer } from 'electron';
import * as ElectronLogger from 'electron-log';
import { Action } from 'redux';
import checkUpdate from '../../main/utils/check-update';
import updateOptions from '../../main/utils/update-options';
import updateTokens from '../../main/utils/update-tokens';
import { initBalancesState } from './cache/balances';

Logger.setInstance(ElectronLogger);

const log = Logger.forCategory('Store');

const api: WalletApi = {
  addressBook: RemoteAddressBook,
  balances: RemoteBalances,
  cache: RemoteCache,
  txHistory: RemoteTxHistory,
  txMeta: RemoteTxMeta,
  vault: RemoteVault,
  xPubPos: RemoteXPubPosition,
};

export const store = createStore(api, new BackendApiInvoker());

function checkOptionsUpdates(appVersion: string, stored: SettingsOptions): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateOptions(appVersion, stored).then((options) => store.dispatch(application.actions.setOptions(options) as any));
}

function checkTokensUpdates(appVersion: string, stored: TokenData[]): void {
  updateTokens(appVersion, stored).then(({ changed, tokens }) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    store.dispatch(application.actions.setTokens(tokens, changed) as any),
  );
}

function checkWalletUpdates(appVersion: string): void {
  checkUpdate(appVersion).then(({ latest, link, version }) => {
    if (!latest) {
      store.dispatch(
        screen.actions.showNotification(
          `A new version of Emerald Wallet is available (${version}).`,
          'info',
          20,
          'Update',
          screen.actions.openLink(link),
        ),
      );
    }
  });
}

function listenElectron(): void {
  log.debug('Running launcher listener for Redux');

  ipcRenderer.on(IpcCommands.STORE_DISPATCH, (event, action) => {
    log.debug(`Got action from IPC: ${JSON.stringify(action)}`);

    store.dispatch(action);

    // TODO remove once we have an api to get history
    if (
      action.type === 'ACCOUNT/SET_BALANCE' &&
      action.payload?.entryId != null &&
      (action.payload?.utxo?.length ?? 0) > 0
    ) {
      const state = store.getState();
      const entry = accounts.selectors.findEntry(state, action.payload.entryId);

      store.dispatch({
        balance: action.payload,
        entry: entry,
        type: 'WALLET/HISTORY/BALANCE_TX',
      });
    }
  });
}

function getInitialScreen(): void {
  store.dispatch(screen.actions.gotoScreen(screen.Pages.WELCOME));

  triggers.onceServicesStart(store).then(() =>
    triggers.onceModeSet(store).then(() =>
      triggers.onceAccountsLoaded(store).then(() =>
        RemoteVault.getOddPasswordItems().then((oddPasswordItems) => {
          if (oddPasswordItems.length > 0) {
            store.dispatch(screen.actions.gotoScreen(screen.Pages.PASSWORD_MIGRATION));
          } else {
            store.dispatch(screen.actions.gotoWalletsScreen() as unknown as Action);
          }
        }),
      ),
    ),
  );
}

function startSync(): void {
  log.info('Start synchronization');

  triggers.onceModeSet(store).then(() => {
    const blockchains = settings.selectors.currentChains(store.getState());

    log.info(`Configured to use blockchains: ${blockchains.map((chain) => chain.params.code).join(', ')}`);

    store.dispatch(accounts.actions.loadSeedsAction());
    store.dispatch(accounts.actions.loadWalletsAction());

    RemoteVault.iconsList().then((iconDetails) => {
      Promise.all(iconDetails.map(async ({ entry: { id } }) => ({ id, icon: await RemoteVault.getIcon(id) }))).then(
        (walletIcons) =>
          store.dispatch(
            accounts.actions.setWalletIcons(
              walletIcons.reduce(
                (carry, { id, icon }) => ({
                  ...carry,
                  [id]: icon == null ? null : Buffer.from(icon).toString('base64'),
                }),
                {},
              ),
            ),
          ),
      );
    });

    const loadChains = blockchains.map(async ({ params: { code: blockchain } }) => {
      await store.dispatch(addressBook.actions.loadLegacyAddressBook(blockchain));
      await store.dispatch(addressBook.actions.loadAddressBook(blockchain));
    });

    Promise.all(loadChains).catch((exception) => log.error('Failed to load chains', exception));

    log.info('Initial synchronization finished');

    store.dispatch(application.actions.connecting(false));
  });

  triggers.onceAccountsLoaded(store).then(() => {
    RemoteCache.get('rates').then((rates) => store.dispatch(settings.actions.setRates(JSON.parse(rates))));

    initBalancesState(api, store);
  });

  ipcRenderer.send(IpcCommands.EMERALD_READY);
}

export function startStore(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    store.dispatch(application.actions.getVersions() as any).then((versions: Versions) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      store.dispatch(application.actions.readConfig() as any).then(() => {
        const { options = {}, tokens = [] } = store.getState().application;

        checkOptionsUpdates(versions.appVersion, options);
        checkTokensUpdates(versions.appVersion, tokens);
      });

      checkWalletUpdates(versions.appVersion);
    });

    store.dispatch(settings.actions.loadSettings());

    listenElectron();
    startSync();
  } catch (exception) {
    log.error(exception);
  }

  getInitialScreen();
}
