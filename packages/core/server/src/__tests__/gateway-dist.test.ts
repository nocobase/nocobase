/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'node:path';
import { supertest } from '@nocobase/test';
import { afterEach, expect, test, vi } from 'vitest';
import { AppSupervisor } from '../app-supervisor';
import { Gateway } from '../gateway';

const originalAppPublicPath = process.env.APP_PUBLIC_PATH;
const originalApiBasePath = process.env.API_BASE_PATH;
const originalStoragePath = process.env.STORAGE_PATH;

const serveHandlerMock = vi.hoisted(() =>
  vi.fn(async (req: { url?: string }, res: { statusCode: number; end: (body?: string) => void }) => {
    res.statusCode = 200;
    res.end(req.url || '');
  }),
);

vi.mock('compression', () => ({
  default: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock('serve-handler', () => ({
  default: serveHandlerMock,
}));

afterEach(async () => {
  if (originalAppPublicPath === undefined) {
    delete process.env.APP_PUBLIC_PATH;
  } else {
    process.env.APP_PUBLIC_PATH = originalAppPublicPath;
  }

  if (originalApiBasePath === undefined) {
    delete process.env.API_BASE_PATH;
  } else {
    process.env.API_BASE_PATH = originalApiBasePath;
  }

  if (originalStoragePath === undefined) {
    delete process.env.STORAGE_PATH;
  } else {
    process.env.STORAGE_PATH = originalStoragePath;
  }

  serveHandlerMock.mockClear();
  await Gateway.getInstance().destroy();
  await AppSupervisor.getInstance().destroy();
});

test('gateway serves APP_PUBLIC_PATH + /dist/ from storage/dist-client', async () => {
  process.env.APP_PUBLIC_PATH = '/console/';
  process.env.API_BASE_PATH = '/api';
  process.env.STORAGE_PATH = '/tmp/nocobase-storage';

  const gateway = Gateway.getInstance();
  const response = await supertest.agent(gateway.getCallback()).get('/console/dist/2.1.0-beta.44/v/assets/index.js');

  expect(response.status).toBe(200);
  expect(response.text).toBe('/2.1.0-beta.44/v/assets/index.js');
  expect(serveHandlerMock).toHaveBeenCalledWith(
    expect.objectContaining({
      url: '/2.1.0-beta.44/v/assets/index.js',
    }),
    expect.anything(),
    expect.objectContaining({
      public: path.join('/tmp/nocobase-storage', 'dist-client'),
      directoryListing: false,
    }),
  );
});
