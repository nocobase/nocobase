/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer } from '@nocobase/test';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import PluginAIServer from '../plugin';
import { aiMcpClients } from '../resource/aiMcpClients';

describe('MCP client database events', () => {
  let app: MockServer;
  let plugin: PluginAIServer;
  let clearUserContextCache: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    app = await createMockServer({
      plugins: ['nocobase'],
    });
    await app.pm.enable('ai');
    plugin = app.pm.get('ai') as PluginAIServer;
    clearUserContextCache = vi.fn().mockResolvedValue(undefined);
    plugin.ai.mcpManager.clearUserContextCache = clearUserContextCache;
  });

  beforeEach(() => {
    clearUserContextCache.mockReset();
    clearUserContextCache.mockResolvedValue(undefined);
  });

  afterAll(async () => {
    await app.db.clean({ drop: true });
    await app.destroy();
  });

  it('clears user-bound cache after transaction commit only for user-bound records', async () => {
    const repository = app.db.getRepository('aiMcpClients');

    const sharedTransaction = await app.db.sequelize.transaction();
    await repository.create({
      values: {
        name: 'shared',
        transport: 'http',
        url: 'http://localhost:3000/mcp',
        useUserContext: false,
      },
      transaction: sharedTransaction,
    });
    await sharedTransaction.commit();
    expect(clearUserContextCache).toHaveBeenCalledTimes(0);

    const boundTransaction = await app.db.sequelize.transaction();
    await repository.create({
      values: {
        name: 'bound',
        transport: 'http',
        url: 'http://localhost:3000/mcp',
        useUserContext: true,
      },
      transaction: boundTransaction,
    });
    expect(clearUserContextCache).toHaveBeenCalledTimes(0);

    await boundTransaction.commit();
    expect(clearUserContextCache).toHaveBeenCalledTimes(1);
  });

  it('clears user-bound cache after commit when a user-bound record is disabled', async () => {
    const repository = app.db.getRepository('aiMcpClients');
    await repository.create({
      values: {
        name: 'bound-to-disable',
        transport: 'http',
        url: 'http://localhost:3000/mcp',
        useUserContext: true,
      },
    });
    clearUserContextCache.mockClear();

    const transaction = await app.db.sequelize.transaction();
    await repository.update({
      filterByTk: 'bound-to-disable',
      values: {
        useUserContext: false,
      },
      transaction,
    });
    expect(clearUserContextCache).toHaveBeenCalledTimes(0);

    await transaction.commit();
    expect(clearUserContextCache).toHaveBeenCalledTimes(1);
  });

  it('does not block transaction commit while clearing user-bound cache', async () => {
    const repository = app.db.getRepository('aiMcpClients');
    let resolveClearCache: () => void;
    const clearCachePromise = new Promise<void>((resolve) => {
      resolveClearCache = resolve;
    });
    clearUserContextCache.mockReturnValue(clearCachePromise);

    const transaction = await app.db.sequelize.transaction();
    await repository.create({
      values: {
        name: 'bound-for-fire-and-go',
        transport: 'http',
        url: 'http://localhost:3000/mcp',
        useUserContext: true,
      },
      transaction,
    });

    await expect(transaction.commit()).resolves.toBeUndefined();
    expect(clearUserContextCache).toHaveBeenCalledTimes(1);

    resolveClearCache();
    await clearCachePromise;
  });
});

describe('aiMcpClients resource actions', () => {
  it('passes request ctx when listing MCP tools', async () => {
    const tools = {
      profile: [],
    };
    const listMCPTools = vi.fn().mockResolvedValue(tools);
    const ctx = {
      app: {
        pm: {
          get: vi.fn(() => ({
            ai: {
              mcpManager: {
                listMCPTools,
              },
            },
          })),
        },
      },
      body: undefined,
    };
    const next = vi.fn().mockResolvedValue(undefined);
    const action = aiMcpClients.actions?.listTools as (ctx: typeof ctx, next: typeof next) => Promise<void>;

    await action(ctx, next);

    expect(listMCPTools).toHaveBeenCalledWith(ctx);
    expect(ctx.body).toBe(tools);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
