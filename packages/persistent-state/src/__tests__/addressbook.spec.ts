import { BlockchainCode, PersistentState, blockchainCodeToId } from '@emeraldwallet/core';
import { tempPath } from './_commons';
import { PersistentStateImpl } from '../api';

describe('Address Book', () => {
  let path: string;
  let state: PersistentStateImpl;

  beforeEach(() => {
    path = tempPath('addrbook');
    state = new PersistentStateImpl(path);
  });

  afterEach(() => {
    state.close();
  });

  test('empty query', async () => {
    const act = await state.addressbook.query();

    expect(act).toEqual({ items: [], cursor: null });
  });

  test('add an item and query all', async () => {
    const item: PersistentState.AddressbookItem = {
      address: {
        address: '0x2EA8846a26B6af5F63CAAe912BB3c4064B94D54B',
        type: 'plain',
      },
      blockchain: blockchainCodeToId(BlockchainCode.ETH),
    };

    const id = await state.addressbook.add(item);
    const act = await state.addressbook.query();

    expect(act.items.length).toBe(1);
    expect(act.items[0].id).toBe(id);
    expect(act.items[0].address).toEqual(item.address);
  });

  test('add an get item', async () => {
    const item: PersistentState.AddressbookItem = {
      address: {
        address: '0x2EA8846a26B6af5F63CAAe912BB3c4064B94D54B',
        type: 'plain',
      },
      blockchain: blockchainCodeToId(BlockchainCode.ETH),
    };

    const id = await state.addressbook.add(item);
    const act = await state.addressbook.get(id);

    expect(act).toBeDefined();
    expect(act?.address).toEqual(item.address);
  });

  test('return nothing for non existing id', async () => {
    const item: PersistentState.AddressbookItem = {
      address: {
        address: '0x2EA8846a26B6af5F63CAAe912BB3c4064B94D54B',
        type: 'plain',
      },
      blockchain: blockchainCodeToId(BlockchainCode.ETH),
    };

    const otherId = 'a43e0aa5-7d07-43cb-81d3-fe21be748a2d';

    const id = await state.addressbook.add(item);
    const act = await state.addressbook.get(otherId);
    const existing = await state.addressbook.get(id);

    expect(id === otherId).toBeFalsy();
    expect(act).toBeNull();
    expect(existing).toBeDefined();
  });

  test('update label', async () => {
    const item: PersistentState.AddressbookItem = {
      address: {
        address: '0x2EA8846a26B6af5F63CAAe912BB3c4064B94D54B',
        type: 'plain',
      },
      blockchain: blockchainCodeToId(BlockchainCode.ETH),
    };

    const id = await state.addressbook.add(item);
    const updated = await state.addressbook.update(id, { label: 'test' });
    const act = await state.addressbook.query();

    expect(updated).toBeTruthy();
    expect(act.items.length).toBe(1);
    expect(act.items[0].label).toBe('test');
  });

  test('update description', async () => {
    const item: PersistentState.AddressbookItem = {
      address: {
        address: '0x2EA8846a26B6af5F63CAAe912BB3c4064B94D54B',
        type: 'plain',
      },
      blockchain: blockchainCodeToId(BlockchainCode.ETH),
    };

    const id = await state.addressbook.add(item);
    const updated = await state.addressbook.update(id, { description: 'test' });
    const act = await state.addressbook.query();

    expect(updated).toBeTruthy();
    expect(act.items.length).toBe(1);
    expect(act.items[0].description).toBe('test');
  });

  test('add an item and query using cursor', async () => {
    await Promise.all(
      Array(10)
        .fill(null)
        .map(async (_, index) => {
          const item: PersistentState.AddressbookItem = {
            address: {
              address: `0x2EA8846a26B6af5F63CAAe912BB3c4064B94D50${index}`,
              type: 'plain',
            },
            blockchain: blockchainCodeToId(BlockchainCode.ETH),
          };

          await state.addressbook.add(item);
        }),
    );

    const page1 = await state.addressbook.query({}, { limit: 5 });

    expect(page1.items.length).toBe(5);
    expect(page1.items[0].address.address).toBe('0x2EA8846a26B6af5F63CAAe912BB3c4064B94D509');
    expect(page1.cursor).toBeDefined();

    const page2 = await state.addressbook.query({}, { cursor: page1.cursor, limit: 5 });

    expect(page2.items.length).toBe(5);
    expect(page2.items[0].address.address).toBe('0x2EA8846a26B6af5F63CAAe912BB3c4064B94D504');
  });

  test('add an item, remove and query all', async () => {
    const item: PersistentState.AddressbookItem = {
      address: {
        address: '0x2EA8846a26B6af5F63CAAe912BB3c4064B94D54B',
        type: 'plain',
      },
      blockchain: blockchainCodeToId(BlockchainCode.ETH),
    };

    const id = await state.addressbook.add(item);
    await state.addressbook.remove(id);
    const act = await state.addressbook.query();

    expect(act.items.length).toBe(0);
  });

  test('add an item, query all, close state, open state and query all', async () => {
    const item: PersistentState.AddressbookItem = {
      address: {
        address: '0x2EA8846a26B6af5F63CAAe912BB3c4064B94D54B',
        type: 'plain',
      },
      blockchain: blockchainCodeToId(BlockchainCode.ETH),
    };

    await state.addressbook.add(item);
    let act = await state.addressbook.query();

    expect(act.items.length).toBe(1);

    state.close();
    state = new PersistentStateImpl(path);

    act = await state.addressbook.query();

    expect(act.items.length).toBe(1);
  });
});
