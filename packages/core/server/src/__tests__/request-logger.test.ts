/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { requestLogger, type Logger } from '@nocobase/logger';
import { describe, expect, it } from 'vitest';

describe('request logger', () => {
  it('preserves request source, referer, custom whitelist, and ordinary query values', async () => {
    const token = 'raw-query-credential';
    const { entries, middleware } = createLoggerHarness({
      requestWhitelist: ['header.x-request-source', 'header.referer', 'query', 'url', 'originalUrl'],
    });
    const ctx = createContext({
      url: `/api/users:list?page=1&authRef=${token}`,
      requestHeader: {
        'x-request-source': 'cli',
        referer: `https://example.test/admin/users?page=2&token=${token}#details`,
      },
      requestJson: {
        header: {
          'x-request-source': 'cli',
          referer: `https://example.test/admin/users?page=2&token=${token}#details`,
        },
        query: { page: 1, authRef: token },
        url: `/api/users:list?page=1&authRef=${token}`,
        originalUrl: `/api/users:list?page=1&authRef=${token}`,
      },
    });

    await middleware(ctx, async () => undefined);

    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      message: 'request GET /api/users:list?page=1&authRef=[REDACTED]',
      path: '/api/users:list?page=1&authRef=[REDACTED]',
      requestSource: 'cli',
      req: {
        header: {
          'x-request-source': 'cli',
          referer: 'https://example.test/admin/users?page=2&token=[REDACTED]#details',
        },
        query: { page: 1, authRef: '[REDACTED]' },
        url: '/api/users:list?page=1&authRef=[REDACTED]',
        originalUrl: '/api/users:list?page=1&authRef=[REDACTED]',
      },
    });
    expect(entries[1]).toMatchObject({
      message: 'response /api/users:list?page=1&authRef=[REDACTED]',
      path: '/api/users:list?page=1&authRef=[REDACTED]',
      requestSource: 'cli',
    });
    expect(JSON.stringify(entries)).not.toContain(token);
  });

  it.each([
    ['normal response', async () => undefined, 200],
    [
      'ACL rejection',
      async (ctx: RequestLoggerContext) => {
        ctx.status = 403;
      },
      403,
    ],
    [
      'handler error',
      async () => {
        throw new Error('handler failed');
      },
      500,
    ],
  ] as const)('redacts recursive action fields for a %s', async (_label, next, status) => {
    const token = 'raw-action-credential';
    const { entries, middleware } = createLoggerHarness();
    const ctx = createContext({
      action: {
        resourceName: 'remoteSource',
        actionName: 'configure',
        params: {
          values: {
            authRef: token,
            nested: {
              Authorization: `Bearer ${token}`,
              list: [{ privateKey: token }, { clientSecret: token }],
            },
          },
        },
      },
    });

    const run = middleware(ctx, async () => {
      try {
        await next(ctx);
      } catch (error) {
        ctx.status = status;
        throw error;
      }
    });
    if (_label === 'handler error') {
      await expect(run).rejects.toThrow('handler failed');
    } else {
      await run;
    }

    expect(entries).toHaveLength(2);
    expect(entries[0].action).toBe(entries[1].action);
    expect(entries[0].action).toMatchObject({
      params: {
        values: {
          authRef: '[REDACTED]',
          nested: {
            Authorization: '[REDACTED]',
            list: [{ privateKey: '[REDACTED]' }, { clientSecret: '[REDACTED]' }],
          },
        },
      },
    });
    expect(JSON.stringify(entries)).not.toContain(token);
  });

  it('keeps the response error contract unchanged', async () => {
    const errors = [{ code: 'INTERNAL_ERROR', message: 'ordinary error', details: { retryable: false } }];
    const { entries, middleware } = createLoggerHarness();
    const ctx = createContext({ status: 500, body: { errors } });

    await middleware(ctx, async () => undefined);

    expect(entries[1].res).toEqual(errors);
  });
});

type LogEntry = Record<string, unknown>;

interface RequestLoggerContext {
  status: number;
}

interface ContextOptions {
  url?: string;
  requestHeader?: Record<string, unknown>;
  requestJson?: Record<string, unknown>;
  action?: Record<string, unknown>;
  status?: number;
  body?: unknown;
}

function createLoggerHarness(options?: { requestWhitelist?: string[] }) {
  const entries: LogEntry[] = [];
  const append = (entry: unknown) => entries.push(toRecord(entry));
  const logger = { info: append, warn: append, error: append } as unknown as Logger;
  return {
    entries,
    middleware: requestLogger('main', logger, options),
  };
}

function createContext(options: ContextOptions = {}) {
  const requestHeader = options.requestHeader || { 'x-request-source': 'cli' };
  const action = options.action || { resourceName: 'users', actionName: 'list' };
  const status = options.status || 200;
  return {
    reqId: 'req-1',
    path: '/api/users:list',
    url: options.url || '/api/users:list?page=1',
    method: 'GET',
    action: {
      toJSON: () => action,
    },
    app: {
      log: {
        child: () => ({}),
      },
    },
    request: {
      header: requestHeader,
      toJSON: () => options.requestJson || { header: requestHeader },
    },
    response: {
      length: 0,
      status,
      toJSON: () => ({ status }),
    },
    res: {
      setHeader: () => undefined,
    },
    status,
    body: options.body || { data: [] },
    auth: {},
  };
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}
