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

import os from 'node:os';
import path from 'node:path';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('../lib/env-auth.js', () => ({
  resolveServerRequestTarget: vi.fn(async () => ({
    baseUrl: 'http://localhost:13000/api',
    token: 'test-token',
  })),
}));

import {
  executeApiRequest,
  executeDownloadApiRequest,
  executeMultipartApiRequest,
  executeRawApiRequest,
} from '../lib/api-client.js';

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

test('executeDownloadApiRequest writes response body to output path', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'nocobase-api-download-'));
  const outputPath = path.join(dir, 'artifact.nbdata');
  try {
    globalThis.fetch = (async () => {
      return new Response('downloaded file', {
        status: 200,
        headers: {
          'x-nocobase-publish-checksum': 'sha256:test',
          'x-nocobase-publish-type': 'migration',
        },
      });
    }) as typeof fetch;

    const response = await executeDownloadApiRequest({
      method: 'get',
      path: '/publishCommands:download',
      outputPath,
    });

    expect(response.ok).toBe(true);
    expect(await readFile(outputPath, 'utf8')).toBe('downloaded file');
    expect((response.data as any).checksum).toBe('sha256:test');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('executeMultipartApiRequest sends form fields and file', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'nocobase-api-upload-'));
  const filePath = path.join(dir, 'artifact.nbdata');
  try {
    await writeFile(filePath, 'upload file');
    let form: FormData | undefined;

    globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
      form = init?.body as FormData;
      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch;

    const response = await executeMultipartApiRequest({
      method: 'post',
      path: '/publishCommands:upload',
      filePath,
      fields: {
        type: 'migration',
      },
    });

    expect(response.ok).toBe(true);
    expect(form?.get('type')).toBe('migration');
    expect(form?.get('file')).toBeInstanceOf(Blob);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
