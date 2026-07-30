/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  ensureCrossEnvConfirmed: vi.fn(),
  executeRawApiRequest: vi.fn(),
}));

vi.mock('../lib/env-guard.js', () => ({
  ensureCrossEnvConfirmed: mocks.ensureCrossEnvConfirmed,
}));

vi.mock('../lib/api-client.js', () => ({
  executeRawApiRequest: mocks.executeRawApiRequest,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.ensureCrossEnvConfirmed.mockResolvedValue(true);
});

test('swagger list returns normalized namespaces from the selected env', async () => {
  const { default: SwaggerList } = await import('../commands/api/swagger/list.js');
  const log = vi.fn();
  mocks.executeRawApiRequest.mockResolvedValue({
    ok: true,
    status: 200,
    data: {
      data: [
        { name: 'NocoBase API', url: '/api/swagger:get' },
        {
          name: 'Collection API - Orders',
          url: '/api/swagger:get?ns=collections%2Forders',
        },
      ],
    },
  });

  const command = Object.assign(Object.create(SwaggerList.prototype), {
    argv: ['--env', 'dev', '--yes', '--json'],
    parse: vi.fn(async () => ({
      flags: {
        env: 'dev',
        yes: true,
        'json-output': true,
      },
    })),
    error: (message: string) => {
      throw new Error(message);
    },
    log,
  });

  await SwaggerList.prototype.run.call(command);

  expect(mocks.ensureCrossEnvConfirmed).toHaveBeenCalledWith({
    command,
    requestedEnv: 'dev',
    yes: true,
  });
  expect(mocks.executeRawApiRequest).toHaveBeenCalledWith({
    envName: 'dev',
    baseUrl: undefined,
    token: undefined,
    role: undefined,
    method: 'GET',
    path: '/swagger:getUrls',
    query: undefined,
  });
  expect(JSON.parse(log.mock.calls[0][0])).toEqual([
    { name: 'NocoBase API', namespace: 'all', url: '/api/swagger:get' },
    {
      name: 'Collection API - Orders',
      namespace: 'collections/orders',
      url: '/api/swagger:get?ns=collections%2Forders',
    },
  ]);
});

test('swagger get prints the requested namespace as an OpenAPI document', async () => {
  const { default: SwaggerGet } = await import('../commands/api/swagger/get.js');
  const log = vi.fn();
  const document = {
    openapi: '3.0.3',
    info: {
      title: 'Collection API - Orders',
      version: '1.0.0',
    },
    paths: {
      '/orders:list': {},
    },
  };
  mocks.executeRawApiRequest.mockResolvedValue({
    ok: true,
    status: 200,
    data: document,
  });

  const command = Object.assign(Object.create(SwaggerGet.prototype), {
    argv: ['--namespace', 'collections/orders', '--json'],
    parse: vi.fn(async () => ({
      flags: {
        namespace: 'collections/orders',
        'json-output': true,
      },
    })),
    error: (message: string) => {
      throw new Error(message);
    },
    log,
  });

  await SwaggerGet.prototype.run.call(command);

  expect(mocks.executeRawApiRequest).toHaveBeenCalledWith({
    envName: undefined,
    baseUrl: undefined,
    token: undefined,
    role: undefined,
    method: 'GET',
    path: '/swagger:get',
    query: {
      ns: 'collections/orders',
    },
  });
  expect(JSON.parse(log.mock.calls[0][0])).toEqual(document);
});
