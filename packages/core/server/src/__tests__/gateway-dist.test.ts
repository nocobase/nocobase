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
const originalModernClientPrefix = process.env.APP_MODERN_CLIENT_PREFIX;
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

  if (originalModernClientPrefix === undefined) {
    delete process.env.APP_MODERN_CLIENT_PREFIX;
  } else {
    process.env.APP_MODERN_CLIENT_PREFIX = originalModernClientPrefix;
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

test.each(['/console/x', '/console/x/'])(
  'gateway redirects portal root %s to the modern client root',
  async (requestPath) => {
    const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-gateway-portal-'));
    process.env.APP_PUBLIC_PATH = '/console/';
    process.env.APP_MODERN_CLIENT_PREFIX = 'modern';
    process.env.API_BASE_PATH = '/api';
    process.env.STORAGE_PATH = storagePath;

    try {
      const gateway = Gateway.getInstance();
      const response = await supertest.agent(gateway.getCallback()).get(`${requestPath}?from=portal`);

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/console/modern/?from=portal');
      expect(serveHandlerMock).not.toHaveBeenCalled();
    } finally {
      await rm(storagePath, { recursive: true, force: true });
    }
  },
);

test.each(['/console/x/apps/crm', '/console/x/apps/crm/'])(
  'gateway redirects sub-app portal root %s to the scoped modern client root',
  async (requestPath) => {
    const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-gateway-portal-'));
    process.env.APP_PUBLIC_PATH = '/console/';
    process.env.APP_MODERN_CLIENT_PREFIX = 'modern';
    process.env.API_BASE_PATH = '/api';
    process.env.STORAGE_PATH = storagePath;

    try {
      const gateway = Gateway.getInstance();
      const response = await supertest.agent(gateway.getCallback()).get(`${requestPath}?from=portal`);

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/console/modern/apps/crm/?from=portal');
      expect(serveHandlerMock).not.toHaveBeenCalled();
    } finally {
      await rm(storagePath, { recursive: true, force: true });
    }
  },
);

test('gateway redirects a portal path without trailing slash', async () => {
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-gateway-portal-'));
  process.env.APP_PUBLIC_PATH = '/console/';
  process.env.API_BASE_PATH = '/api';
  process.env.STORAGE_PATH = storagePath;

  await mkdir(path.join(storagePath, 'portals', 'main', 'admin', 'dist'), { recursive: true });
  await writeFile(path.join(storagePath, 'portals', 'main', 'admin', 'dist', 'index.html'), '<div id="root"></div>');

  try {
    const gateway = Gateway.getInstance();
    const response = await supertest.agent(gateway.getCallback()).get('/console/x/admin?from=portal');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/console/x/admin/?from=portal');
    expect(serveHandlerMock).not.toHaveBeenCalled();
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('gateway serves main portal assets from storage/portals/main/<portal>/dist', async () => {
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-gateway-portal-'));
  process.env.APP_PUBLIC_PATH = '/console/';
  process.env.API_BASE_PATH = '/api';
  process.env.STORAGE_PATH = storagePath;

  await mkdir(path.join(storagePath, 'portals'), { recursive: true });
  await mkdir(path.join(storagePath, 'portals', 'main', 'admin', 'dist'), { recursive: true });
  await writeFile(path.join(storagePath, 'portals', 'main', 'admin', 'dist', 'index.html'), '<div id="root"></div>');

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
        public: path.join(storagePath, 'portals', 'main', 'admin', 'dist'),
        directoryListing: false,
      }),
    );
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('gateway maps portal deep links to the portal index html', async () => {
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-gateway-portal-'));
  process.env.APP_PUBLIC_PATH = '/console/';
  process.env.API_BASE_PATH = '/api';
  process.env.STORAGE_PATH = storagePath;

  await mkdir(path.join(storagePath, 'portals'), { recursive: true });
  await mkdir(path.join(storagePath, 'portals', 'main', 'admin', 'dist'), { recursive: true });
  await writeFile(
    path.join(storagePath, 'portals', 'main', 'admin', 'dist', 'index.html'),
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
  await mkdir(path.join(storagePath, 'portals', 'crm', 'admin', 'dist'), { recursive: true });
  await writeFile(path.join(storagePath, 'portals', 'crm', 'admin', 'dist', 'index.html'), '<div id="root"></div>');

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
        public: path.join(storagePath, 'portals', 'crm', 'admin', 'dist'),
        directoryListing: false,
      }),
    );
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('gateway redirects a sub-app portal path without trailing slash', async () => {
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-gateway-portal-'));
  process.env.APP_PUBLIC_PATH = '/console/';
  process.env.API_BASE_PATH = '/api';
  process.env.STORAGE_PATH = storagePath;

  await mkdir(path.join(storagePath, 'portals', 'crm', 'admin', 'dist'), { recursive: true });
  await writeFile(path.join(storagePath, 'portals', 'crm', 'admin', 'dist', 'index.html'), '<div id="root"></div>');

  try {
    const gateway = Gateway.getInstance();
    const response = await supertest.agent(gateway.getCallback()).get('/console/x/apps/crm/admin?from=portal');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/console/x/apps/crm/admin/?from=portal');
    expect(serveHandlerMock).not.toHaveBeenCalled();
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test.each([
  ['/console/x/missing?from=portal', '/console/v/?from=portal'],
  ['/console/x/missing/?from=portal', '/console/v/?from=portal'],
  ['/console/x/missing/deep/path?from=portal', '/console/v/?from=portal'],
  ['/console/x/apps/crm/missing?from=portal', '/console/v/apps/crm/?from=portal'],
  ['/console/x/apps/crm/missing/?from=portal', '/console/v/apps/crm/?from=portal'],
])(
  'gateway redirects unavailable portal path %s to the default Portal entry',
  async (requestPath, expectedLocation) => {
    const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-gateway-portal-'));
    process.env.APP_PUBLIC_PATH = '/console/';
    process.env.API_BASE_PATH = '/api';
    process.env.STORAGE_PATH = storagePath;

    await mkdir(path.join(storagePath, 'portals'), { recursive: true });

    try {
      const gateway = Gateway.getInstance();
      const response = await supertest.agent(gateway.getCallback()).get(requestPath);

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe(expectedLocation);
      expect(serveHandlerMock).not.toHaveBeenCalled();
    } finally {
      await rm(storagePath, { recursive: true, force: true });
    }
  },
);
