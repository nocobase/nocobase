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
 * For more information, please refer to https://www.nocobase.com/agreement.
 */

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import type { IncomingMessage } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { PortalRequestResolver, getPortalReservedNames } from '@nocobase/utils/portal';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createPortalProxyBypass } from '../../../devtools/rsbuildConfig.js';

describe('PortalRequestResolver', () => {
  const originalStoragePath = process.env.STORAGE_PATH;
  let storageRoot: string;

  beforeEach(async () => {
    storageRoot = await mkdtemp(path.join(os.tmpdir(), 'nocobase-portal-resolver-'));
  });

  afterEach(async () => {
    if (originalStoragePath === undefined) {
      delete process.env.STORAGE_PATH;
    } else {
      process.env.STORAGE_PATH = originalStoragePath;
    }
    await rm(storageRoot, { recursive: true, force: true });
  });

  async function createPortal(name: string) {
    const distPath = path.join(storageRoot, 'portals', name, 'dist');
    await mkdir(distPath, { recursive: true });
    await writeFile(path.join(distPath, 'index.html'), '<!doctype html>');
  }

  it('resolves portal requests inside APP_PUBLIC_PATH', async () => {
    await createPortal('test-dist');
    const resolver = new PortalRequestResolver({ getStorageRoot: () => storageRoot });

    expect(resolver.resolve('/console/test-dist', '/console/')).toMatchObject({
      portalName: 'test-dist',
      relativePath: '',
      publicPath: '/console/',
    });
    expect(resolver.resolve('/console/test-dist/assets/app.js?version=1', '/console/')).toMatchObject({
      portalName: 'test-dist',
      relativePath: '/assets/app.js',
      search: '?version=1',
    });
    expect(resolver.resolve('/test-dist/', '/console/')).toBeNull();
  });

  it('ignores invalid and reserved portal names', async () => {
    await Promise.all(['admin', 'api', 'v', 'Bad-Portal', 'under_score'].map(createPortal));
    const resolver = new PortalRequestResolver({ getStorageRoot: () => storageRoot });

    expect(resolver.resolve('/admin/', '/')).toBeNull();
    expect(resolver.resolve('/api/', '/')).toBeNull();
    expect(resolver.resolve('/v/', '/')).toBeNull();
    expect(resolver.resolve('/Bad-Portal/', '/')).toBeNull();
    expect(resolver.resolve('/under_score/', '/')).toBeNull();
  });

  it('reserves configured API, websocket, and modern client prefixes', () => {
    const reservedNames = getPortalReservedNames({
      API_BASE_PATH: '/rest-api/',
      WS_PATH: '/socket/',
      APP_MODERN_CLIENT_PREFIX: 'modern',
    });

    expect(reservedNames.has('rest-api')).toBe(true);
    expect(reservedNames.has('socket')).toBe(true);
    expect(reservedNames.has('modern')).toBe(true);
  });

  it('discovers newly added portals after the short cache expires', async () => {
    let now = 0;
    const resolver = new PortalRequestResolver({
      cacheTtlMs: 1000,
      getStorageRoot: () => storageRoot,
      now: () => now,
    });

    expect(resolver.resolve('/dynamic/', '/')).toBeNull();
    await createPortal('dynamic');

    now = 999;
    expect(resolver.resolve('/dynamic/', '/')).toBeNull();

    now = 1001;
    expect(resolver.resolve('/dynamic/', '/')).toMatchObject({ portalName: 'dynamic' });
  });

  it('requires a regular dist/index.html file', async () => {
    await mkdir(path.join(storageRoot, 'portals', 'incomplete', 'dist'), { recursive: true });
    const resolver = new PortalRequestResolver({ getStorageRoot: () => storageRoot });

    expect(resolver.resolve('/incomplete/', '/')).toBeNull();
  });

  it('creates an Rsbuild bypass that proxies only discovered portals', async () => {
    await createPortal('test-dist');
    process.env.STORAGE_PATH = storageRoot;
    const bypass = createPortalProxyBypass('/console/');

    expect(bypass({ url: '/console/test-dist/assets/app.js' } as IncomingMessage)).toBeUndefined();
    expect(bypass({ url: '/console/not-a-portal/' } as IncomingMessage)).toBe(true);
    expect(bypass({ url: '/console/admin/' } as IncomingMessage)).toBe(true);
  });
});
