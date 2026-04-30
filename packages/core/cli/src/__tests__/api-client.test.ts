/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

test('executeApiRequest preserves authorization across same-url http to https redirects', async () => {
  const calls: Array<{ url: string; auth: string | null; redirect?: RequestRedirect }> = [];

  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const headers = init?.headers as Headers;
    calls.push({
      url,
      auth: headers?.get('authorization') ?? null,
      redirect: init?.redirect,
    });

    if (url.startsWith('http://')) {
      return new Response(null, {
        status: 308,
        headers: {
          location: url.replace('http://', 'https://'),
        },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;

  const response = await executeApiRequest({
    flags: {},
    operation: {
      method: 'get',
      pathTemplate: '/users:list',
      parameters: [],
    },
  });

  expect(response.ok).toBe(true);
  expect(calls).toEqual([
    {
      url: 'http://localhost:13000/api/users:list',
      auth: 'Bearer test-token',
      redirect: 'manual',
    },
    {
      url: 'https://localhost:13000/api/users:list',
      auth: 'Bearer test-token',
      redirect: 'manual',
    },
  ]);
});

test('executeApiRequest sends multipart file bodies without setting JSON content type', async () => {
  const filePath = join(tmpdir(), `nocobase-cli-upload-${Date.now()}.txt`);
  await fs.writeFile(filePath, 'upload body', 'utf8');
  let requestHeaders: Headers | undefined;
  let requestBody: BodyInit | null | undefined;

  globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
    requestHeaders = init?.headers as Headers;
    requestBody = init?.body;
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;

  try {
    await executeApiRequest({
      flags: {
        file: filePath,
      },
      operation: {
        method: 'post',
        pathTemplate: '/files:upload',
        requestContentType: 'multipart/form-data',
        hasBody: true,
        bodyRequired: true,
        parameters: [
          {
            name: 'file',
            flagName: 'file',
            in: 'body',
            required: true,
            type: 'string',
            isFile: true,
          },
        ],
      },
    });

    expect(requestHeaders?.get('content-type')).toBe(null);
    expect(requestBody).toBeInstanceOf(FormData);
  } finally {
    await fs.unlink(filePath).catch(() => undefined);
  }
});

test('executeApiRequest writes binary responses to --output', async () => {
  const outputPath = join(tmpdir(), `nocobase-cli-download-${Date.now()}.bin`);

  globalThis.fetch = (async () => {
    return new Response('download body', {
      status: 200,
      headers: { 'content-type': 'application/octet-stream' },
    });
  }) as typeof fetch;

  try {
    const response = await executeApiRequest({
      flags: {
        output: outputPath,
      },
      operation: {
        method: 'get',
        pathTemplate: '/files:download',
        responseType: 'binary',
        parameters: [],
      },
    });

    expect(response.ok).toBe(true);
    expect(response.data).toEqual({ output: outputPath });
    await expect(fs.readFile(outputPath, 'utf8')).resolves.toBe('download body');
  } finally {
    await fs.unlink(outputPath).catch(() => undefined);
  }
});
