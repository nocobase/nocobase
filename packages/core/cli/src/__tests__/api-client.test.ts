/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, expect, test, vi } from 'vitest';

vi.mock('../lib/env-auth.js', () => ({
  resolveServerRequestTarget: vi.fn(async () => ({
    baseUrl: 'http://localhost:13000/api',
    token: 'test-token',
  })),
}));

import { executeApiRequest, executeRawApiRequest } from '../lib/api-client.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('executeApiRequest sends the CLI request source header', async () => {
  let requestHeaders: Headers | undefined;

  globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
    requestHeaders = init?.headers as Headers;
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;

  await executeApiRequest({
    flags: {},
    operation: {
      method: 'get',
      pathTemplate: '/users:list',
      parameters: [],
    },
  });

  expect(requestHeaders?.get('x-request-source')).toBe('cli');
  expect(requestHeaders?.get('authorization')).toBe('Bearer test-token');
});

test('executeRawApiRequest preserves custom headers and adds the CLI request source header', async () => {
  let requestHeaders: Headers | undefined;

  globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
    requestHeaders = init?.headers as Headers;
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;

  await executeRawApiRequest({
    method: 'post',
    path: '/users:create',
    headers: {
      'x-data-source': 'test',
    },
    body: {
      nickname: 'Ada',
    },
  });

  expect(requestHeaders?.get('x-request-source')).toBe('cli');
  expect(requestHeaders?.get('x-data-source')).toBe('test');
  expect(requestHeaders?.get('content-type')).toBe('application/json');
});
