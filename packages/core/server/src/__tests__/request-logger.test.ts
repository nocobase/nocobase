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

describe('request logger security', () => {
  it('uses ctx.path, preserves request source, and strips referer query and fragment', async () => {
    const { entries, middleware } = createLoggerHarness();
    const ctx = createContext({
      requestHeader: {
        'x-request-source': 'cli',
        referer: 'https://example.test/admin/users?token=unsafe#secret',
      },
    });

    await middleware(ctx, async () => {});

    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      message: 'request GET /api/users:list',
      path: '/api/users:list',
      requestSource: 'cli',
      req: {
        header: {
          'x-request-source': 'cli',
          referer: 'https://example.test/admin/users',
        },
      },
    });
    expect(entries[1]).toMatchObject({
      message: 'response /api/users:list',
      path: '/api/users:list',
      requestSource: 'cli',
    });
    expect(JSON.stringify(entries)).not.toContain('page=1');
    expect(JSON.stringify(entries)).not.toContain('token=unsafe');
    expect(JSON.stringify(entries)).not.toContain('#secret');
  });

  it('recursively redacts sensitive keys and GitHub PAT values in both action snapshots', async () => {
    const token = 'github_pat_012345678901234567890123456789';
    const { entries, middleware } = createLoggerHarness();
    const ctx = createContext({
      action: {
        resourceName: 'vscRemote',
        actionName: 'configure',
        params: {
          values: {
            credential: token,
            password: 'plain-password',
            nested: {
              Authorization: `Bearer ${token}`,
              harmless: `prefix ${token} suffix`,
            },
            list: [{ privateKey: token }, token],
          },
        },
      },
    });

    await middleware(ctx, async () => {});

    const serialized = JSON.stringify(entries);
    expect(serialized).not.toContain(token);
    expect(serialized).not.toContain('Bearer');
    expect(serialized).not.toContain('plain-password');
    expect(serialized).toContain('[REDACTED]');
    expect(toRecord(entries[0]).action).toEqual(toRecord(entries[1]).action);
  });

  it('redacts request source values and drops query-bearing fields from custom whitelists', async () => {
    const token = 'ghp_012345678901234567890123456789012345';
    const entries: LogEntry[] = [];
    const append = (entry: unknown) => entries.push(toRecord(entry));
    const logger = { info: append, warn: append, error: append } as unknown as Logger;
    const middleware = requestLogger('main', logger, {
      requestWhitelist: ['header.x-request-source', 'query', 'url', 'originalUrl'],
    });
    const ctx = createContext({
      requestHeader: { 'x-request-source': token },
      requestJson: {
        header: { 'x-request-source': token },
        query: { page: 1, marker: 'ordinary-query-value' },
        url: `/api/users:list?marker=ordinary-query-value&token=${token}`,
        originalUrl: `/api/users:list?marker=ordinary-query-value&token=${token}`,
      },
    });

    await middleware(ctx, async () => {});

    const serialized = JSON.stringify(entries);
    expect(serialized).not.toContain(token);
    expect(serialized).not.toContain('ordinary-query-value');
    expect(entries[0]).toMatchObject({ requestSource: '[REDACTED]' });
    expect(entries[1]).toMatchObject({ requestSource: '[REDACTED]' });
  });

  it('logs only safe error fields for failed responses', async () => {
    const token = 'ghp_012345678901234567890123456789012345';
    const { entries, middleware } = createLoggerHarness();
    const ctx = createContext({
      status: 502,
      body: {
        errors: [
          {
            code: 'REMOTE_UNAVAILABLE',
            status: 502,
            message: `Remote unavailable ${token}`,
            details: {
              provider: 'github',
              reasonCode: 'network-error',
              requestId: 'request-safe',
              response: { body: token },
              headers: { Authorization: token },
              cause: { message: token },
            },
            response: { data: token },
            cause: { token },
          },
        ],
      },
    });

    await middleware(ctx, async () => {});

    expect(entries).toHaveLength(2);
    expect(entries[1]).toMatchObject({
      status: 502,
      res: [
        {
          code: 'REMOTE_UNAVAILABLE',
          status: 502,
          message: 'Remote unavailable [REDACTED]',
          details: {
            provider: 'github',
            reasonCode: 'network-error',
            requestId: 'request-safe',
          },
        },
      ],
    });
    const serialized = JSON.stringify(entries[1]);
    expect(serialized).not.toContain(token);
    expect(serialized).not.toContain('Authorization');
    expect(serialized).not.toContain('cause');
  });
});

type LogEntry = Record<string, unknown>;

function createLoggerHarness() {
  const entries: LogEntry[] = [];
  const append = (entry: unknown) => entries.push(toRecord(entry));
  const logger = {
    info: append,
    warn: append,
    error: append,
  } as unknown as Logger;
  return {
    entries,
    middleware: requestLogger('main', logger),
  };
}

interface ContextOptions {
  requestHeader?: Record<string, unknown>;
  requestJson?: Record<string, unknown>;
  action?: Record<string, unknown>;
  status?: number;
  body?: unknown;
}

function createContext(options: ContextOptions = {}) {
  const requestHeader = options.requestHeader || {};
  const action = options.action || { resourceName: 'users', actionName: 'list' };
  const status = options.status || 200;
  return {
    reqId: 'req-1',
    path: '/api/users:list',
    url: '/api/users:list?page=1',
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
      toJSON: () => ({
        status,
      }),
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
