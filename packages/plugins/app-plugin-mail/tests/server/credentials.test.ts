import {
  createMailTestDatabase,
  destroyMailTestDatabase,
} from '../helpers/database.js';
import { type DatabaseManager, type Row } from '@nocobase/db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createDatabaseMailCredentialVault,
  DatabaseMailCredentialVault,
} from '../../server/credentials.js';
import { createDatabaseMailStore } from '../../server/store.js';

describe('Mail OAuth persistence', () => {
  let database: DatabaseManager;

  beforeEach(async () => {
    database = await createMailTestDatabase();
  });

  afterEach(async () => {
    await destroyMailTestDatabase(database);
  });

  it('stores credentials as JSON and supports token rotation', async () => {
    const vault = createDatabaseMailCredentialVault(database);
    const reference = await vault.put({
      accessToken: 'access-secret',
      refreshToken: 'refresh-secret',
    });
    const row = await database
      .query()
      .selectFrom<Row>('mailCredentials')
      .selectAll()
      .where('reference', '=', reference)
      .executeTakeFirstOrThrow();

    expect(JSON.parse(String(row.value))).toEqual({
      accessToken: 'access-secret',
      refreshToken: 'refresh-secret',
    });
    await expect(vault.get(reference)).resolves.toEqual({
      accessToken: 'access-secret',
      refreshToken: 'refresh-secret',
    });

    await vault.replace(reference, { accessToken: 'rotated-secret' });
    await expect(vault.get(reference)).resolves.toEqual({
      accessToken: 'rotated-secret',
    });
  });

  it('removes expired OAuth verifier credentials without deleting account credentials', async () => {
    const vault = createDatabaseMailCredentialVault(database);
    const accountReference = await vault.put({ accessToken: 'account-token' });
    const verifierReference = await vault.put(
      { codeVerifier: 'temporary-verifier' },
      {
        purpose: 'authorization',
        expiresAt: '2026-09-04T00:00:00.000Z',
      },
    );

    await expect(vault.deleteExpired('2026-09-04T00:00:01.000Z')).resolves.toBe(
      1,
    );
    await expect(vault.get(accountReference)).resolves.toEqual({
      accessToken: 'account-token',
    });
    await expect(vault.get(verifierReference)).rejects.toThrow(
      'Mail credential was not found.',
    );
  });

  it('coalesces concurrent refreshes for the same credential', async () => {
    const vault = createDatabaseMailCredentialVault(database);
    const secondVault = createDatabaseMailCredentialVault(database);
    const reference = await vault.put({ token: 'expired' });
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const refresh = vi.fn(async () => {
      await gate;
      return { token: 'fresh' };
    });

    const first = vault.getOrRefresh<{ token: string }>(
      reference,
      (value) => value.token === 'fresh',
      refresh,
    );
    const second = secondVault.getOrRefresh<{ token: string }>(
      reference,
      (value) => value.token === 'fresh',
      refresh,
    );
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    release?.();

    await expect(Promise.all([first, second])).resolves.toEqual([
      { token: 'fresh' },
      { token: 'fresh' },
    ]);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('renews the credential lease while a slow refresh is running', async () => {
    const vault = new DatabaseMailCredentialVault(database, 30, 5);
    const secondVault = new DatabaseMailCredentialVault(database, 30, 5);
    const reference = await vault.put({ token: 'expired' });
    const refresh = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 80));
      return { token: 'fresh' };
    });

    await expect(
      Promise.all([
        vault.getOrRefresh(
          reference,
          (value: { token: string }) => value.token === 'fresh',
          refresh,
        ),
        secondVault.getOrRefresh(
          reference,
          (value: { token: string }) => value.token === 'fresh',
          refresh,
        ),
      ]),
    ).resolves.toEqual([{ token: 'fresh' }, { token: 'fresh' }]);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('aborts a refresh that never completes and releases its local flight', async () => {
    const vault = new DatabaseMailCredentialVault(database, 100, 5, 20);
    const reference = await vault.put({ token: 'expired' });
    const refresh = vi.fn(
      (_value: { token: string }, signal?: AbortSignal) =>
        new Promise<{ token: string }>((_resolve, reject) => {
          signal?.addEventListener('abort', () => reject(signal.reason), {
            once: true,
          });
        }),
    );

    await expect(
      vault.getOrRefresh(
        reference,
        (value: { token: string }) => value.token === 'fresh',
        refresh,
      ),
    ).rejects.toThrow('Mail credential refresh timed out.');
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('consumes an OAuth state transaction exactly once', async () => {
    const store = createDatabaseMailStore(database);
    const transaction = {
      stateHash: 'a'.repeat(64),
      userId: 'user-1',
      provider: { type: 'gmail', name: 'google' },
      redirectUri: 'https://example.com/main/mail/oauth/callback',
      verifierCredentialReference: 'mail-credential:verifier',
      scopes: ['gmail.modify'],
      initialSyncReceivedAfter: '2026-02-01T00:00:00.000Z',
      expiresAt: '2099-01-01T00:00:00.000Z',
    } as const;

    await store.createAuthorizationTransaction(transaction);

    await expect(
      store.consumeAuthorizationTransaction(
        transaction.stateHash,
        '2026-09-04T00:00:00.000Z',
      ),
    ).resolves.toMatchObject(transaction);
    await expect(
      store.consumeAuthorizationTransaction(
        transaction.stateHash,
        '2026-09-04T00:00:01.000Z',
      ),
    ).resolves.toBeUndefined();
  });

  it('stores an authorized account and its identity atomically', async () => {
    const store = createDatabaseMailStore(database);
    const account = {
      id: 'account-1',
      userId: 'user-1',
      provider: { type: 'gmail', name: 'google' },
      address: 'user@example.com',
      credentialReference: 'mail-credential:account-1',
      scopes: ['gmail.modify'],
      status: 'active' as const,
    };
    const identity = {
      id: 'duplicate-identity',
      accountId: account.id,
      address: account.address,
      isPrimary: true,
      canSend: true,
    };

    await expect(
      store.saveAuthorizedAccount(account, [identity, identity]),
    ).rejects.toThrow();
    await expect(store.getAccount(account.id)).resolves.toBeUndefined();
  });

  it('finds an account by stable Provider subject after its address changes', async () => {
    const store = createDatabaseMailStore(database);
    await store.saveAuthorizedAccount(
      {
        id: 'account-1',
        userId: 'user-1',
        provider: { type: 'microsoft', name: 'microsoft-365' },
        address: 'User@Example.com',
        credentialReference: 'mail-credential:account-1',
        authorizationSubject: 'provider-subject-1',
        scopes: [],
        status: 'active',
      },
      [],
    );

    await expect(
      store.findAccountByProviderIdentity(
        { type: 'microsoft', name: 'microsoft-365' },
        'renamed@example.com',
        'provider-subject-1',
      ),
    ).resolves.toMatchObject({
      id: 'account-1',
      address: 'user@example.com',
    });
    await expect(
      store.findActiveAccountsForPush(
        { type: 'microsoft', name: 'microsoft-365' },
        [],
        ['USER@EXAMPLE.COM'],
      ),
    ).resolves.toMatchObject([{ id: 'account-1' }]);
  });
});
