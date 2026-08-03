/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { supertest } from '@nocobase/test';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppSupervisor } from '../app-supervisor';
import { Gateway } from '../gateway';

const originalEnvironment = {
  APP_PACKAGE_ROOT: process.env.APP_PACKAGE_ROOT,
  APP_PUBLIC_PATH: process.env.APP_PUBLIC_PATH,
  APP_MODERN_CLIENT_PREFIX: process.env.APP_MODERN_CLIENT_PREFIX,
  API_BASE_PATH: process.env.API_BASE_PATH,
  CDN_BASE_URL: process.env.CDN_BASE_URL,
};

function restoreEnvironmentValue(key: keyof typeof originalEnvironment) {
  const value = originalEnvironment[key];
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

describe('gateway standalone settings client', () => {
  let gateway: Gateway;
  let packageRoot: string;

  beforeEach(async () => {
    packageRoot = await mkdtemp(path.join(os.tmpdir(), 'nocobase-gateway-settings-'));
    await mkdir(path.join(packageRoot, 'dist/client/v'), { recursive: true });
    await mkdir(path.join(packageRoot, 'dist/client/settings/assets'), { recursive: true });
    await writeFile(path.join(packageRoot, 'dist/client/index.html'), '<html>legacy-client</html>');
    await writeFile(path.join(packageRoot, 'dist/client/v/index.html'), '<html>modern-client</html>');
    await writeFile(
      path.join(packageRoot, 'dist/client/settings/index.html'),
      '<html><head><script src="/settings/assets/runtime.js" type="module"></script></head><body>settings-client</body></html>',
    );
    await writeFile(path.join(packageRoot, 'dist/client/settings/assets/runtime.js'), 'settings-runtime');

    process.env.APP_PACKAGE_ROOT = packageRoot;
    process.env.APP_PUBLIC_PATH = '/nocobase/';
    process.env.APP_MODERN_CLIENT_PREFIX = 'modern';
    process.env.API_BASE_PATH = '/nocobase/api/';
    delete process.env.CDN_BASE_URL;
    gateway = Gateway.getInstance();
  });

  afterEach(async () => {
    await gateway.destroy();
    await AppSupervisor.getInstance().destroy();
    await rm(packageRoot, { recursive: true, force: true });
    for (const key of Object.keys(originalEnvironment) as Array<keyof typeof originalEnvironment>) {
      restoreEnvironmentValue(key);
    }
  });

  it.each([
    '/nocobase/settings',
    '/nocobase/settings/signin',
    '/nocobase/settings/signup',
    '/nocobase/settings/forgot-password',
    '/nocobase/settings/reset-password?resetToken=test-token',
    '/nocobase/settings/2fa?redirect=%2Fnocobase%2Fsettings%2Fworkflow',
    '/nocobase/settings/workflow',
    '/nocobase/settings/apps/analytics/signin',
    '/nocobase/settings/apps/analytics/workflow/workflows/42',
    '/nocobase/settings/_app/analytics/reset-password?resetToken=test-token',
    '/nocobase/settings/_app/analytics/ai/knowledge-base/detail/orders/documents',
  ])('serves the settings HTML for %s', async (requestPath) => {
    const response = await supertest.agent(gateway.getCallback()).get(requestPath);

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.text).toContain('settings-client');
    expect(response.text).not.toContain('legacy-client');
  });

  it('serves standalone settings assets from the isolated output directory', async () => {
    const response = await supertest.agent(gateway.getCallback()).get('/nocobase/settings/assets/runtime.js');

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('public, max-age=31536000, immutable');
    expect(response.text).toBe('settings-runtime');
  });

  it('injects the app public path and rewrites assets for public-path deployments', async () => {
    const response = await supertest
      .agent(gateway.getCallback())
      .get('/nocobase/settings/apps/analytics/workflow?tab=executions');

    expect(response.text).toContain(`window['__nocobase_public_path__'] = "/nocobase/";`);
    expect(response.text).toContain('src="/nocobase/settings/assets/runtime.js"');
  });

  it('rewrites settings assets to the isolated CDN directory', async () => {
    process.env.CDN_BASE_URL = 'https://cdn.example.com/releases/42/';

    const response = await supertest.agent(gateway.getCallback()).get('/nocobase/settings/workflow');

    expect(response.text).toContain('src="https://cdn.example.com/releases/42/settings/assets/runtime.js"');
  });

  it.each([
    ['/nocobase/modern/admin/settings/workflow?tab=executions', '/nocobase/settings/workflow?tab=executions'],
    ['/nocobase/modern/admin/workflow/workflows/42?from=list', '/nocobase/settings/workflow/workflows/42?from=list'],
    [
      '/nocobase/modern/admin/workflow/executions/99?from=workflow',
      '/nocobase/settings/workflow/executions/99?from=workflow',
    ],
    ['/nocobase/modern/apps/analytics/admin/settings/workflow', '/nocobase/settings/apps/analytics/workflow'],
    [
      '/nocobase/modern/_app/analytics/admin/workflow/workflows/42',
      '/nocobase/settings/_app/analytics/workflow/workflows/42',
    ],
  ])('redirects the old v2 settings route %s to %s', async (requestPath, expectedLocation) => {
    const response = await supertest.agent(gateway.getCallback()).get(requestPath);

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(expectedLocation);
  });

  it.each([
    [
      '/nocobase/modern/admin/settings/mail/oauth2?code=main-code',
      '/nocobase/admin/settings/mail/oauth2?code=main-code',
    ],
    [
      '/nocobase/modern/apps/analytics/admin/settings/mail/oauth2?code=sub-code',
      '/nocobase/apps/analytics/admin/settings/mail/oauth2?code=sub-code',
    ],
  ])('redirects the email OAuth callback %s to the legacy client', async (requestPath, expectedLocation) => {
    const response = await supertest.agent(gateway.getCallback()).get(requestPath);

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(expectedLocation);
  });

  it.each([
    '/nocobase/admin/settings/workflow',
    '/nocobase/admin/workflow/workflows/42',
    '/nocobase/admin/settings/mail/oauth2?code=legacy-code',
    '/nocobase/apps/analytics/settings/workflow',
    '/nocobase/_app/analytics/settings/workflow',
  ])('keeps the v1 URL %s on the legacy HTML', async (requestPath) => {
    const response = await supertest.agent(gateway.getCallback()).get(requestPath);

    expect(response.status).toBe(200);
    expect(response.text).toContain('legacy-client');
    expect(response.text).not.toContain('settings-client');
  });

  it('keeps unrelated v2 routes on the modern HTML', async () => {
    const response = await supertest.agent(gateway.getCallback()).get('/nocobase/modern/admin/workflow/tasks');

    expect(response.status).toBe(200);
    expect(response.text).toContain('modern-client');
    expect(response.text).not.toContain('settings-client');
  });
});
