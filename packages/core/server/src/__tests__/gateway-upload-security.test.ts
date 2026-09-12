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
import { createMockServer, MockServer, supertest } from '@nocobase/test';
import { getAuthCookieName } from '@nocobase/utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Gateway } from '../gateway';

const originalAppPublicPath = process.env.APP_PUBLIC_PATH;
const originalApiBasePath = process.env.API_BASE_PATH;
const originalStoragePath = process.env.STORAGE_PATH;
const originalLegacyLocalStoragePublicAccess = process.env.LEGACY_LOCAL_STORAGE_PUBLIC_ACCESS;

describe('gateway upload security', () => {
  let storagePath: string;
  let app: MockServer;

  beforeEach(async () => {
    storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-gateway-upload-security-'));
    await mkdir(path.join(storagePath, 'uploads'), { recursive: true });
    process.env.APP_PUBLIC_PATH = '/console/';
    process.env.API_BASE_PATH = '/console/api/';
    process.env.STORAGE_PATH = storagePath;
    delete process.env.LEGACY_LOCAL_STORAGE_PUBLIC_ACCESS;
    app = await createMockServer({
      acl: true,
      resourcer: { prefix: '/console/api' },
      plugins: ['users', 'auth', 'acl', 'field-sort', 'data-source-manager', 'error-handler', 'system-settings'],
    });
  });

  afterEach(async () => {
    if (originalAppPublicPath === undefined) {
      delete process.env.APP_PUBLIC_PATH;
    } else {
      process.env.APP_PUBLIC_PATH = originalAppPublicPath;
    }

    if (originalStoragePath === undefined) {
      delete process.env.STORAGE_PATH;
    } else {
      process.env.STORAGE_PATH = originalStoragePath;
    }

    if (originalApiBasePath === undefined) {
      delete process.env.API_BASE_PATH;
    } else {
      process.env.API_BASE_PATH = originalApiBasePath;
    }

    if (originalLegacyLocalStoragePublicAccess === undefined) {
      delete process.env.LEGACY_LOCAL_STORAGE_PUBLIC_ACCESS;
    } else {
      process.env.LEGACY_LOCAL_STORAGE_PUBLIC_ACCESS = originalLegacyLocalStoragePublicAccess;
    }

    if (app) {
      await app.destroy();
    }
    await rm(storagePath, { recursive: true, force: true });
  });

  it.each([
    ['report.pdf', '%PDF-1.4'],
    ['payload.xml', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'],
  ])('forces active uploaded file %s to download', async (filename, content) => {
    await writeFile(path.join(storagePath, 'uploads', filename), content);

    const user = await app.db.getRepository('users').findOne();
    const loggedAgent = await app.agent().login(user.id);
    const checkResponse = await loggedAgent.resource('auth').check();
    const token = checkResponse.request.header.Authorization.replace('Bearer ', '');

    const response = await supertest
      .agent(Gateway.getInstance().getCallback())
      .get(`/console/storage/uploads/${filename}`)
      .set('Cookie', `${getAuthCookieName('authToken', app.name)}=${token}`);

    expect(response.status).toBe(200);
    expect(response.headers['content-disposition']).toContain('attachment');
    expect(response.headers['content-security-policy']).toBe('sandbox');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['cache-control']).toBe('private, no-store');
  });

  it('rejects anonymous access to legacy upload URLs', async () => {
    await writeFile(path.join(storagePath, 'uploads', 'private.txt'), 'private text');

    const response = await supertest
      .agent(Gateway.getInstance().getCallback())
      .get('/console/storage/uploads/private.txt');

    expect(response.status).toBe(401);
  });

  it('allows anonymous access to legacy upload URLs when public access is enabled', async () => {
    process.env.LEGACY_LOCAL_STORAGE_PUBLIC_ACCESS = 'true';
    await writeFile(path.join(storagePath, 'uploads', 'public.txt'), 'public text');

    const response = await supertest
      .agent(Gateway.getInstance().getCallback())
      .get('/console/storage/uploads/public.txt');

    expect(response.status).toBe(200);
    expect(response.text).toBe('public text');
    expect(response.headers['cache-control']).toBe('private, no-store');
  });

  it('keeps non-active uploaded files inline while sandboxing the response', async () => {
    await writeFile(path.join(storagePath, 'uploads', 'notes.txt'), 'safe text');

    const user = await app.db.getRepository('users').findOne();
    const loggedAgent = await app.agent().login(user.id);
    const checkResponse = await loggedAgent.resource('auth').check();
    const token = checkResponse.request.header.Authorization.replace('Bearer ', '');

    const response = await supertest
      .agent(Gateway.getInstance().getCallback())
      .get('/console/storage/uploads/notes.txt')
      .set('Cookie', `${getAuthCookieName('authToken', app.name)}=${token}`);

    expect(response.status).toBe(200);
    expect(response.headers['content-disposition']).toContain('inline');
    expect(response.headers['content-security-policy']).toBe('sandbox');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.text).toBe('safe text');
  });

  it('forces non-active uploaded files to download when requested', async () => {
    await writeFile(path.join(storagePath, 'uploads', 'notes.txt'), 'safe text');

    const user = await app.db.getRepository('users').findOne();
    const loggedAgent = await app.agent().login(user.id);
    const checkResponse = await loggedAgent.resource('auth').check();
    const token = checkResponse.request.header.Authorization.replace('Bearer ', '');

    const response = await supertest
      .agent(Gateway.getInstance().getCallback())
      .get('/console/storage/uploads/notes.txt?download=1')
      .set('Cookie', `${getAuthCookieName('authToken', app.name)}=${token}`);

    expect(response.status).toBe(200);
    expect(response.headers['content-disposition']).toContain('attachment');
    expect(response.headers['content-security-policy']).toBe('sandbox');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });
});
