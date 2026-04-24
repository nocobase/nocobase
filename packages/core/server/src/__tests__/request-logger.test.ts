/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from 'vitest';
import { requestLogger } from '@nocobase/logger';

test('request logger includes CLI request source in whitelist and top-level log fields', async () => {
  const entries: any[] = [];
  const middleware = requestLogger('main', {
    info: (entry: any) => entries.push(entry),
    warn: (entry: any) => entries.push(entry),
    error: (entry: any) => entries.push(entry),
  } as any);

  const ctx = {
    reqId: 'req-1',
    path: '/api/users:list',
    url: '/api/users:list?page=1',
    method: 'GET',
    action: {
      toJSON: () => ({ resourceName: 'users', actionName: 'list' }),
    },
    app: {
      log: {
        child: () => ({}),
      },
    },
    request: {
      header: {
        'x-request-source': 'cli',
      },
      toJSON: () => ({
        header: {
          'x-request-source': 'cli',
        },
      }),
    },
    response: {
      length: 0,
      status: 200,
      toJSON: () => ({
        status: 200,
      }),
    },
    res: {
      setHeader: () => {},
    },
    status: 200,
    body: {
      data: [],
    },
    auth: {},
  };

  await middleware(ctx, async () => {});

  expect(entries).toHaveLength(2);
  expect(entries[0].requestSource).toBe('cli');
  expect(entries[0].req.header['x-request-source']).toBe('cli');
  expect(entries[1].requestSource).toBe('cli');
});
