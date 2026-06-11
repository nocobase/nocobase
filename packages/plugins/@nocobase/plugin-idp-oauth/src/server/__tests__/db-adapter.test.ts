/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createDbAdapter } from '../db-adapter';

describe('plugin-idp-oauth > DbAdapter', () => {
  const createRecord = (values: Record<string, any>) => ({
    ...values,
    get(key: string) {
      return values[key];
    },
  });

  const createAdapter = () => {
    const repo = {
      findOne: vi.fn(),
      updateOrCreate: vi.fn(),
      update: vi.fn(),
      destroy: vi.fn(),
    };

    const Adapter = createDbAdapter(
      {
        db: {
          getRepository: vi.fn().mockReturnValue(repo),
        },
      } as any,
      'oidcStates',
    );

    return {
      adapter: new Adapter('RefreshToken'),
      repo,
    };
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('upsert should persist oidc state with lookup fields and expiresAt', async () => {
    const { adapter, repo } = createAdapter();

    await adapter.upsert(
      'token-1',
      {
        grantId: 'grant-1',
        uid: 'uid-1',
        userCode: 'code-1',
        foo: 'bar',
      },
      60,
    );

    expect(repo.updateOrCreate).toHaveBeenCalledTimes(1);
    expect(repo.updateOrCreate).toHaveBeenCalledWith({
      filterKeys: ['model', 'oidcId'],
      values: expect.objectContaining({
        model: 'RefreshToken',
        oidcId: 'token-1',
        payload: {
          grantId: 'grant-1',
          uid: 'uid-1',
          userCode: 'code-1',
          foo: 'bar',
        },
        grantId: 'grant-1',
        uid: 'uid-1',
        userCode: 'code-1',
        expiresAt: expect.any(Number),
      }),
    });
  });

  test('upsert should allow non-expiring records such as Client', async () => {
    const repo = {
      findOne: vi.fn(),
      updateOrCreate: vi.fn(),
      update: vi.fn(),
      destroy: vi.fn(),
    };

    const Adapter = createDbAdapter(
      {
        db: {
          getRepository: vi.fn().mockReturnValue(repo),
        },
      } as any,
      'oidcStates',
    );

    const adapter = new Adapter('Client');

    await adapter.upsert('client-1', { client_id: 'client-1' });

    expect(repo.updateOrCreate).toHaveBeenCalledWith({
      filterKeys: ['model', 'oidcId'],
      values: expect.objectContaining({
        model: 'Client',
        oidcId: 'client-1',
        payload: {
          client_id: 'client-1',
        },
        expiresAt: null,
      }),
    });
  });

  test('find should return payload for valid records', async () => {
    const { adapter, repo } = createAdapter();
    repo.findOne.mockResolvedValue(
      createRecord({
        id: 1,
        payload: { foo: 'bar' },
        expiresAt: new Date(Date.now() + 60_000),
      }),
    );

    await expect(adapter.find('token-1')).resolves.toEqual({ foo: 'bar' });
    expect(repo.findOne).toHaveBeenCalledWith({
      filter: {
        model: 'RefreshToken',
        oidcId: 'token-1',
      },
    });
    expect(repo.destroy).not.toHaveBeenCalled();
  });

  test('find should delete expired records and return undefined', async () => {
    const { adapter, repo } = createAdapter();
    repo.findOne.mockResolvedValue(
      createRecord({
        id: 9,
        payload: { foo: 'bar' },
        expiresAt: new Date(Date.now() - 1_000),
      }),
    );

    await expect(adapter.find('token-1')).resolves.toBeUndefined();
    expect(repo.destroy).toHaveBeenCalledWith({
      filterByTk: 9,
    });
  });

  test('consume should mark payload as consumed and update consumedAt', async () => {
    const { adapter, repo } = createAdapter();
    repo.findOne.mockResolvedValue(
      createRecord({
        id: 3,
        payload: { foo: 'bar' },
        expiresAt: new Date(Date.now() + 60_000),
      }),
    );

    await adapter.consume('token-1');

    expect(repo.update).toHaveBeenCalledWith({
      filterByTk: 3,
      values: {
        payload: expect.objectContaining({
          foo: 'bar',
          consumed: expect.any(Number),
        }),
        consumedAt: expect.any(Number),
      },
    });
  });

  test('revokeByGrantId should delete all states for the grant', async () => {
    const { adapter, repo } = createAdapter();

    await adapter.revokeByGrantId('grant-1');

    expect(repo.destroy).toHaveBeenCalledWith({
      filter: {
        grantId: 'grant-1',
      },
    });
  });
});
