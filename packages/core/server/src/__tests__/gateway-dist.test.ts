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
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
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

test('gateway redirects /x/ to the default portal path from manifest', async () => {
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-gateway-portal-'));
  process.env.APP_PUBLIC_PATH = '/console/';
  process.env.API_BASE_PATH = '/api';
  process.env.STORAGE_PATH = storagePath;

  await mkdir(path.join(storagePath, 'portals'), { recursive: true });
  await writeFile(
    path.join(storagePath, 'portals', 'portal-manifest.json'),
    JSON.stringify({
      defaultPortal: 'admin',
      portals: [{ name: 'admin', path: '/admin' }],
    }),
  );

  try {
    const gateway = Gateway.getInstance();
    const response = await supertest.agent(gateway.getCallback()).get('/console/x/');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/console/x/admin/');
    expect(serveHandlerMock).not.toHaveBeenCalled();
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('gateway redirects a portal path without trailing slash', async () => {
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-gateway-portal-'));
  process.env.APP_PUBLIC_PATH = '/console/';
  process.env.API_BASE_PATH = '/api';
  process.env.STORAGE_PATH = storagePath;

  await mkdir(path.join(storagePath, 'portals'), { recursive: true });
  await writeFile(
    path.join(storagePath, 'portals', 'portal-manifest.json'),
    JSON.stringify({
      defaultPortal: 'admin',
      portals: [{ name: 'admin', path: '/admin' }],
    }),
  );

  try {
    const gateway = Gateway.getInstance();
    const response = await supertest.agent(gateway.getCallback()).get('/console/x/admin');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/console/x/admin/');
    expect(serveHandlerMock).not.toHaveBeenCalled();
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('gateway serves main portal assets by manifest path from storage/portals/main/<portal name>/dist', async () => {
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-gateway-portal-'));
  process.env.APP_PUBLIC_PATH = '/console/';
  process.env.API_BASE_PATH = '/api';
  process.env.STORAGE_PATH = storagePath;

  await mkdir(path.join(storagePath, 'portals'), { recursive: true });
  await mkdir(path.join(storagePath, 'portals', 'main', 'console', 'dist'), { recursive: true });
  await writeFile(path.join(storagePath, 'portals', 'main', 'console', 'dist', 'index.html'), '<div id="root"></div>');
  await writeFile(
    path.join(storagePath, 'portals', 'portal-manifest.json'),
    JSON.stringify({
      defaultPortal: 'console',
      portals: [{ app: 'main', name: 'console', path: '/admin' }],
    }),
  );

  try {
    const gateway = Gateway.getInstance();
    const response = await supertest.agent(gateway.getCallback()).get('/console/x/admin/assets/index.js');

    expect(response.status).toBe(200);
    expect(response.text).toBe('/assets/index.js');
    expect(serveHandlerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/assets/index.js',
      }),
      expect.anything(),
      expect.objectContaining({
        public: path.join(storagePath, 'portals', 'main', 'console', 'dist'),
        directoryListing: false,
      }),
    );
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('gateway maps portal deep links by manifest path to the portal index html', async () => {
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-gateway-portal-'));
  process.env.APP_PUBLIC_PATH = '/console/';
  process.env.API_BASE_PATH = '/api';
  process.env.STORAGE_PATH = storagePath;

  await mkdir(path.join(storagePath, 'portals'), { recursive: true });
  await mkdir(path.join(storagePath, 'portals', 'main', 'console', 'dist'), { recursive: true });
  await writeFile(
    path.join(storagePath, 'portals', 'main', 'console', 'dist', 'index.html'),
    [
      '<html>',
      '<head>',
      '<script type="module" src="/assets/index.js"></script>',
      '<link rel="stylesheet" href="/assets/index.css">',
      '<meta property="og:image" content="/logo.png">',
      '<link rel="icon" href="/console/x/admin/favicon.ico">',
      '<meta name="twitter:image" content="/console/x/admin/logo-mark.png">',
      '</head>',
      '<body><div id="root"></div></body>',
      '</html>',
    ].join(''),
  );
  await writeFile(
    path.join(storagePath, 'portals', 'portal-manifest.json'),
    JSON.stringify({
      defaultPortal: 'console',
      portals: [{ app: 'main', name: 'console', path: '/admin' }],
    }),
  );

  try {
    const gateway = Gateway.getInstance();
    const response = await supertest.agent(gateway.getCallback()).get('/console/x/admin/settings/users');

    expect(response.status).toBe(200);
    expect(response.text).toContain('src="/assets/index.js"');
    expect(response.text).toContain('href="/assets/index.css"');
    expect(response.text).toContain('content="/logo.png"');
    expect(response.text).toContain('href="/console/x/admin/favicon.ico"');
    expect(response.text).toContain('content="/console/x/admin/logo-mark.png"');
    expect(response.text).not.toContain('/console/x/admin/console/x/admin/');
    expect(serveHandlerMock).not.toHaveBeenCalled();
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('gateway serves sub-app portal assets from storage/portals/<subapp>/<portal name>/dist', async () => {
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-gateway-portal-'));
  process.env.APP_PUBLIC_PATH = '/console/';
  process.env.API_BASE_PATH = '/api';
  process.env.STORAGE_PATH = storagePath;

  await mkdir(path.join(storagePath, 'portals'), { recursive: true });
  await mkdir(path.join(storagePath, 'portals', 'crm', 'console', 'dist'), { recursive: true });
  await writeFile(path.join(storagePath, 'portals', 'crm', 'console', 'dist', 'index.html'), '<div id="root"></div>');
  await writeFile(
    path.join(storagePath, 'portals', 'portal-manifest.json'),
    JSON.stringify({
      defaultPortal: 'console',
      portals: [{ app: 'main', name: 'console', path: '/admin' }],
    }),
  );

  try {
    const gateway = Gateway.getInstance();
    const response = await supertest.agent(gateway.getCallback()).get('/console/x/apps/crm/admin/assets/index.js');

    expect(response.status).toBe(200);
    expect(response.text).toBe('/assets/index.js');
    expect(serveHandlerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/assets/index.js',
      }),
      expect.anything(),
      expect.objectContaining({
        public: path.join(storagePath, 'portals', 'crm', 'console', 'dist'),
        directoryListing: false,
      }),
    );
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('gateway redirects a sub-app portal root to the default portal path', async () => {
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-gateway-portal-'));
  process.env.APP_PUBLIC_PATH = '/console/';
  process.env.API_BASE_PATH = '/api';
  process.env.STORAGE_PATH = storagePath;

  await mkdir(path.join(storagePath, 'portals'), { recursive: true });
  await writeFile(
    path.join(storagePath, 'portals', 'portal-manifest.json'),
    JSON.stringify({
      defaultPortal: 'console',
      portals: [{ app: 'main', name: 'console', path: '/admin' }],
    }),
  );

  try {
    const gateway = Gateway.getInstance();
    const response = await supertest.agent(gateway.getCallback()).get('/console/x/apps/crm/');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/console/x/apps/crm/admin/');
    expect(serveHandlerMock).not.toHaveBeenCalled();
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('gateway returns 404 when the manifest portal has not been built', async () => {
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-gateway-portal-'));
  process.env.APP_PUBLIC_PATH = '/console/';
  process.env.API_BASE_PATH = '/api';
  process.env.STORAGE_PATH = storagePath;

  await mkdir(path.join(storagePath, 'portals'), { recursive: true });
  await writeFile(
    path.join(storagePath, 'portals', 'portal-manifest.json'),
    JSON.stringify({
      defaultPortal: 'admin',
      portals: [{ name: 'admin', path: '/admin' }],
    }),
  );

  try {
    const gateway = Gateway.getInstance();
    const response = await supertest.agent(gateway.getCallback()).get('/console/x/admin/');

    expect(response.status).toBe(404);
    expect(serveHandlerMock).not.toHaveBeenCalled();
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});
