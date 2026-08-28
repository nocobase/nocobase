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
import { aiMcpClients, guardMCPClientMutations } from '../resource/aiMcpClients';

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
    plugin.ai.mcpManager.clearUserContextCache = clearUserContextCache as () => Promise<void>;
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
    const action = aiMcpClients.actions?.listTools as (actionCtx: typeof ctx, actionNext: typeof next) => Promise<void>;

    await action(ctx, next);

    expect(listMCPTools).toHaveBeenCalledWith(ctx);
    expect(ctx.body).toBe(tools);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('uses only the saved database configuration when testing stdio', async () => {
    const testConnection = vi.fn().mockResolvedValue({ success: true });
    const record = {
      toJSON: () => ({
        name: 'trusted-stdio',
        transport: 'stdio',
        command: 'trusted-command',
        args: ['trusted-arg'],
        env: { TRUSTED: 'true' },
        restart: { enabled: true },
      }),
    };
    const ctx = {
      action: {
        params: {
          filterByTk: 'trusted-stdio',
          values: {
            transport: 'stdio',
            command: 'malicious-command',
            args: ['malicious-arg'],
            env: { MALICIOUS: 'true' },
          },
        },
      },
      db: { getRepository: vi.fn(() => ({ findOne: vi.fn().mockResolvedValue(record) })) },
      app: { pm: { get: vi.fn(() => ({ ai: { mcpManager: { testConnection } } })) } },
      t: (message: string) => message,
      throw: (status: number, message: string) => {
        throw Object.assign(new Error(message), { status });
      },
      body: undefined,
    };
    const next = vi.fn().mockResolvedValue(undefined);
    const action = aiMcpClients.actions?.testConnection as (
      actionCtx: typeof ctx,
      actionNext: typeof next,
    ) => Promise<void>;

    await action(ctx, next);

    expect(testConnection).toHaveBeenCalledWith(
      {
        transport: 'stdio',
        command: 'trusted-command',
        args: ['trusted-arg'],
        env: { TRUSTED: 'true' },
        url: undefined,
        headers: undefined,
        restart: { enabled: true },
        useUserContext: undefined,
      },
      ctx,
    );
    expect(testConnection).not.toHaveBeenCalledWith(expect.objectContaining({ command: 'malicious-command' }), ctx);
  });

  it('rejects untrusted stdio test values without a saved stdio record', async () => {
    const testConnection = vi.fn();
    const ctx = {
      action: { params: { values: { transport: 'stdio', command: 'malicious-command' } } },
      db: { getRepository: vi.fn(() => ({ findOne: vi.fn() })) },
      app: { pm: { get: vi.fn(() => ({ ai: { mcpManager: { testConnection } } })) } },
      t: (message: string) => message,
      throw: (status: number, message: string) => {
        throw Object.assign(new Error(message), { status });
      },
      body: undefined,
    };
    const action = aiMcpClients.actions?.testConnection as (
      actionCtx: typeof ctx,
      actionNext: () => Promise<void>,
    ) => Promise<void>;

    await expect(action(ctx, vi.fn())).rejects.toMatchObject({ status: 400 });
    expect(testConnection).not.toHaveBeenCalled();
  });

  it('returns 404 for a missing filterByTk record and never falls back to stdio request values', async () => {
    const testConnection = vi.fn();
    const ctx = {
      action: {
        params: { filterByTk: 'missing', values: { transport: 'stdio', command: 'malicious-command' } },
      },
      db: { getRepository: vi.fn(() => ({ findOne: vi.fn().mockResolvedValue(null) })) },
      app: { pm: { get: vi.fn(() => ({ ai: { mcpManager: { testConnection } } })) } },
      t: (message: string) => message,
      throw: (status: number, message: string) => {
        throw Object.assign(new Error(message), { status });
      },
      body: undefined,
    };
    const action = aiMcpClients.actions?.testConnection as (
      actionCtx: typeof ctx,
      actionNext: () => Promise<void>,
    ) => Promise<void>;

    await expect(action(ctx, vi.fn())).rejects.toMatchObject({ status: 404 });
    expect(testConnection).not.toHaveBeenCalled();
  });

  it('keeps HTTP form-value connection tests unchanged', async () => {
    const result = { success: true };
    const testConnection = vi.fn().mockResolvedValue(result);
    const values = { transport: 'http' as const, url: 'https://example.com/mcp', headers: { Authorization: 'test' } };
    const ctx = {
      action: { params: { values } },
      db: { getRepository: vi.fn(() => ({ findOne: vi.fn() })) },
      app: { pm: { get: vi.fn(() => ({ ai: { mcpManager: { testConnection } } })) } },
      t: (message: string) => message,
      throw: (status: number, message: string) => {
        throw Object.assign(new Error(message), { status });
      },
      body: undefined,
    };
    const next = vi.fn().mockResolvedValue(undefined);
    const action = aiMcpClients.actions?.testConnection as (
      actionCtx: typeof ctx,
      actionNext: typeof next,
    ) => Promise<void>;

    await action(ctx, next);

    expect(testConnection).toHaveBeenCalledWith(expect.objectContaining(values), ctx);
    expect(ctx.body).toBe(result);
  });

  it.each([
    ['update', { transport: 'stdio', fromFile: false }],
    ['destroy', { transport: 'stdio', fromFile: null }],
    ['update', { transport: 'http', fromFile: true }],
  ])('blocks managed MCP %s mutations', async (actionName, recordValues) => {
    const next = vi.fn();
    const ctx = {
      action: {
        resourceName: 'aiMcpClients',
        actionName,
        params: { filterByTk: 'managed', values: {} },
      },
      db: {
        getRepository: vi.fn(() => ({
          find: vi.fn().mockResolvedValue([{ get: (key: string) => recordValues[key] }]),
        })),
      },
      t: (message: string) => message,
      throw: (status: number, message: string) => {
        throw Object.assign(new Error(message), { status });
      },
    };

    await expect(guardMCPClientMutations(ctx as never, next)).rejects.toMatchObject({ status: 400 });
    expect(next).not.toHaveBeenCalled();
  });

  it('allows enabled-only updates for managed MCP records', async () => {
    const next = vi.fn();
    const ctx = {
      action: {
        resourceName: 'aiMcpClients',
        actionName: 'update',
        params: { filterByTk: 'managed', values: { enabled: false } },
      },
      db: {
        getRepository: vi.fn(() => ({
          find: vi.fn().mockResolvedValue([{ get: (key: string) => (key === 'transport' ? 'stdio' : false) }]),
        })),
      },
      t: (message: string) => message,
      throw: (status: number, message: string) => {
        throw Object.assign(new Error(message), { status });
      },
    };

    await guardMCPClientMutations(ctx as never, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
  it('rejects stdio creation and strips forged source markers from HTTP creation', async () => {
    const stdioContext = {
      action: {
        resourceName: 'aiMcpClients',
        actionName: 'create',
        params: { values: { transport: 'stdio', fromFile: true } },
      },
      t: (message: string) => message,
      throw: (status: number, message: string) => {
        throw Object.assign(new Error(message), { status });
      },
    };
    await expect(guardMCPClientMutations(stdioContext as never, vi.fn())).rejects.toMatchObject({ status: 400 });

    const values = { transport: 'http', fromFile: true };
    const next = vi.fn();
    const httpContext = {
      action: { resourceName: 'aiMcpClients', actionName: 'create', params: { values } },
      t: (message: string) => message,
    };
    await guardMCPClientMutations(httpContext as never, next);

    expect(values).toEqual({ transport: 'http' });
    expect(next).toHaveBeenCalledTimes(1);
  });
});
