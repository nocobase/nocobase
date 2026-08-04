/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AppSupervisor } from '@nocobase/server';
import { createMockServer, type MockServer } from '@nocobase/test';
import { mkdtemp, rm } from 'fs/promises';
import os from 'os';
import path from 'path';

const PORTAL_GATE_PLUGINS = [
  'error-handler',
  'users',
  'auth',
  'client',
  'field-sort',
  'acl',
  'ui-schema-storage',
  'system-settings',
  'data-source-main',
  'data-source-manager',
  'ui-layout',
  'multi-portal',
];

async function createPortalGateApp(name?: string) {
  const app = await createMockServer({
    name,
    registerActions: true,
    acl: true,
    plugins: PORTAL_GATE_PLUGINS,
  });
  await app.db.sync();
  return app;
}

async function destroyPortalGateApp(app: MockServer) {
  if (app.name) {
    await AppSupervisor.getInstance().removeAppManifest(app.name, 'multi-portal');
  }
  await app.destroy();
}

async function createSharedPortal(app: MockServer) {
  await app.db.getRepository('multiPortals').create({
    values: {
      uid: 'shared-portal',
      title: 'Shared Portal name',
      portalType: 'no-code',
      portalName: 'shared-portal',
      routePath: '/shared-portal',
      authCheck: true,
      enabled: true,
      uiLayoutUid: 'admin-layout-model',
    },
  });
}

describe('Portal access gate application isolation', () => {
  const originalInitPortalName = process.env.INIT_PORTAL_NAME;
  const originalInitPortalType = process.env.INIT_PORTAL_TYPE;
  const originalStoragePath = process.env.STORAGE_PATH;
  let storagePath: string;

  beforeAll(async () => {
    storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-portal-gate-app-isolation-'));
    process.env.INIT_PORTAL_NAME = 'admin';
    process.env.INIT_PORTAL_TYPE = 'no-code';
    process.env.STORAGE_PATH = storagePath;
  });

  afterAll(async () => {
    await rm(storagePath, { recursive: true, force: true });
    if (originalStoragePath === undefined) {
      delete process.env.STORAGE_PATH;
    } else {
      process.env.STORAGE_PATH = originalStoragePath;
    }
    if (originalInitPortalName === undefined) {
      delete process.env.INIT_PORTAL_NAME;
    } else {
      process.env.INIT_PORTAL_NAME = originalInitPortalName;
    }
    if (originalInitPortalType === undefined) {
      delete process.env.INIT_PORTAL_TYPE;
    } else {
      process.env.INIT_PORTAL_TYPE = originalInitPortalType;
    }
  });

  it('resolves the Portal only from the current main or sub-application database', async () => {
    const mainApp = await createPortalGateApp();
    try {
      await mainApp.db.getRepository('multiPortals').destroy({ filterByTk: '__default_portal__' });
      await createSharedPortal(mainApp);
      const mainRootUser = await mainApp.db.getRepository('users').findOne({ filter: { 'roles.name': 'root' } });
      const mainRootAgent = await mainApp.agent().login(mainRootUser);
      const mainResponse = await mainRootAgent.get('/roles:check').set('X-Portal', 'shared-portal');

      expect(mainResponse.status).toBe(200);
    } finally {
      await destroyPortalGateApp(mainApp);
    }

    const subApp = await createPortalGateApp('portal-gate-subapp');
    try {
      await subApp.db.getRepository('multiPortals').destroy({ filterByTk: '__default_portal__' });
      const subRootUser = await subApp.db.getRepository('users').findOne({ filter: { 'roles.name': 'root' } });
      const subRootAgent = await subApp.agent().login(subRootUser);
      const missingInSubAppResponse = await subRootAgent.get('/roles:check').set('X-Portal', 'shared-portal');

      expect(missingInSubAppResponse.status).toBe(404);
      expect(missingInSubAppResponse.body.errors).toEqual([
        expect.objectContaining({
          code: 'PORTAL_NOT_FOUND',
        }),
      ]);

      await createSharedPortal(subApp);
      const subAppResponse = await subRootAgent.get('/roles:check').set('X-Portal', 'shared-portal');

      expect(subAppResponse.status).toBe(200);
    } finally {
      await destroyPortalGateApp(subApp);
    }
  });
});
