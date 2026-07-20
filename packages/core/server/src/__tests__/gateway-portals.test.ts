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
import os from 'node:os';
import path from 'node:path';
import { supertest } from '@nocobase/test';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppSupervisor } from '../app-supervisor';
import { Gateway } from '../gateway';

const originalAppPublicPath = process.env.APP_PUBLIC_PATH;
const originalApiBasePath = process.env.API_BASE_PATH;
const originalStoragePath = process.env.STORAGE_PATH;

describe('gateway portals', () => {
  let storageRoot: string;

  beforeEach(async () => {
    storageRoot = await mkdtemp(path.join(os.tmpdir(), 'nocobase-gateway-portal-'));
    const distPath = path.join(storageRoot, 'portals', 'test-dist', 'dist');
    await mkdir(path.join(distPath, 'assets'), { recursive: true });
    await writeFile(path.join(distPath, 'index.html'), '<!doctype html><main>Portal application</main>');
    await writeFile(path.join(distPath, 'assets', 'app.js'), 'console.log("portal");');
    await writeFile(path.join(distPath, 'assets', 'logo mark.svg'), '<svg></svg>');
    await writeFile(path.join(distPath, 'extensionless'), 'extensionless asset');
    await writeFile(path.join(distPath, '.env'), 'SECRET=value');

    process.env.APP_PUBLIC_PATH = '/console/';
    process.env.API_BASE_PATH = '/api/';
    process.env.STORAGE_PATH = storageRoot;
  });

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

    await Gateway.getInstance().destroy();
    await AppSupervisor.getInstance().destroy();
    await rm(storageRoot, { recursive: true, force: true });
  });

  it('redirects the portal root to a trailing slash and preserves the query string', async () => {
    const response = await supertest.agent(Gateway.getInstance().getCallback()).get('/console/test-dist?theme=dark');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/console/test-dist/?theme=dark');
  });

  it('serves a portal directly under the site root when APP_PUBLIC_PATH is root', async () => {
    process.env.APP_PUBLIC_PATH = '/';
    const response = await supertest.agent(Gateway.getInstance().getCallback()).get('/test-dist/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Portal application');
  });

  it('serves the portal index and static assets with conservative headers', async () => {
    const agent = supertest.agent(Gateway.getInstance().getCallback());
    const indexResponse = await agent.get('/console/test-dist/');
    const assetResponse = await agent.get('/console/test-dist/assets/app.js');
    const encodedAssetResponse = await agent.get('/console/test-dist/assets/logo%20mark.svg');

    expect(indexResponse.status).toBe(200);
    expect(indexResponse.text).toContain('Portal application');
    expect(indexResponse.headers['cache-control']).toBe('no-cache');
    expect(indexResponse.headers['x-content-type-options']).toBe('nosniff');
    expect(assetResponse.status).toBe(200);
    expect(assetResponse.text).toBe('console.log("portal");');
    expect(assetResponse.headers['content-type']).toContain('application/javascript');
    expect(assetResponse.headers['last-modified']).toBeTruthy();
    expect(encodedAssetResponse.status).toBe(200);
    expect(encodedAssetResponse.headers['content-type']).toContain('image/svg+xml');
  });

  it('uses index.html only for extensionless HTML navigations', async () => {
    const agent = supertest.agent(Gateway.getInstance().getCallback());
    const navigationResponse = await agent.get('/console/test-dist/users/123').set('Accept', 'text/html');
    const dataResponse = await agent.get('/console/test-dist/users/123').set('Accept', 'application/json');
    const missingAssetResponse = await agent.get('/console/test-dist/assets/missing.js').set('Accept', 'text/html');

    expect(navigationResponse.status).toBe(200);
    expect(navigationResponse.text).toContain('Portal application');
    expect(dataResponse.status).toBe(404);
    expect(dataResponse.text).toBe('Not Found');
    expect(missingAssetResponse.status).toBe(404);
    expect(missingAssetResponse.text).toBe('Not Found');
  });

  it('serves an existing extensionless file before applying SPA fallback', async () => {
    const response = await supertest
      .agent(Gateway.getInstance().getCallback())
      .get('/console/test-dist/extensionless')
      .set('Accept', 'text/html');

    expect(response.status).toBe(200);
    expect(response.text).toBe('extensionless asset');
  });

  it('rejects hidden files and malformed encoded paths', async () => {
    const agent = supertest.agent(Gateway.getInstance().getCallback());
    const hiddenFileResponse = await agent.get('/console/test-dist/%2Eenv');
    const malformedPathResponse = await agent.get('/console/test-dist/%E0%A4%A');

    expect(hiddenFileResponse.status).toBe(404);
    expect(hiddenFileResponse.text).toBe('Not Found');
    expect(malformedPathResponse.status).toBe(400);
    expect(malformedPathResponse.text).toBe('Bad Request');
  });

  it('rejects non-static HTTP methods inside a portal', async () => {
    const response = await supertest.agent(Gateway.getInstance().getCallback()).post('/console/test-dist/action');

    expect(response.status).toBe(405);
    expect(response.headers.allow).toBe('GET, HEAD');
    expect(response.text).toBe('Method Not Allowed');
  });
});
