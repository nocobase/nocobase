/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Transaction } from '@nocobase/database';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { ClientAppService } from '../services/ClientAppService';
import { JsPortalStorage, type JsPortalWorkspaceFile } from '../services/JsPortalStorage';

describe('ClientAppService', () => {
  let root: string;
  let storage: JsPortalStorage;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'js-portal-service-'));
    storage = new JsPortalStorage(root);
    await storage.replaceWorkspaceFiles('repo-1', portalFiles('customer', 'Customer Portal'));
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('lists and resolves enabled storage-backed JS Portals', async () => {
    const service = new ClientAppService(createDb(), storage);

    await expect(service.listSelectableClientApps()).resolves.toEqual([
      {
        entryId: 'repo-1:customer',
        repoId: 'repo-1',
        key: 'customer',
        title: 'Customer Portal',
        repoTitle: 'Repository 1',
      },
    ]);
    await expect(service.resolveClientApp('repo-1:customer')).resolves.toMatchObject({
      entryId: 'repo-1:customer',
      kind: 'client-app',
      entryHtml: 'index.html',
      fileCount: 3,
    });
    await expect(service.resolveClientApp('repo-1:missing')).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_ENTRY_NOT_FOUND',
    });
  });

  it('keeps disabled repository portals unavailable at runtime', async () => {
    const service = new ClientAppService(createDb('disabled'), storage);

    await expect(service.listSelectableClientApps()).resolves.toEqual([]);
    await expect(service.resolveClientApp('repo-1:customer')).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_REPO_DISABLED',
    });
  });

  it('uses storage portal IDs for reference protection and removes storage after commit', async () => {
    const service = new ClientAppService(createDb(), storage);
    const resolver = vi.fn(async () => [
      { entryId: 'repo-1:customer', ownerKind: 'multiPortal.frontend', ownerId: 'portal-1' },
    ]);
    service.useReferenceResolver(resolver);
    const afterCommit: Array<() => Promise<void>> = [];
    const transaction = {
      afterCommit: (callback: () => Promise<void>) => afterCommit.push(callback),
    } as unknown as Transaction;

    await expect(service.listReferencesForRepo('repo-1', transaction)).resolves.toEqual([
      { entryId: 'repo-1:customer', ownerKind: 'multiPortal.frontend', ownerId: 'portal-1' },
    ]);
    await service.retireClientAppsForRepo('repo-1', transaction);
    await expect(storage.listPortals('repo-1')).resolves.toHaveLength(1);
    await afterCommit[0]();
    await expect(storage.listPortals('repo-1')).resolves.toEqual([]);
  });
});

function createDb(lifecycleStatus = 'enabled'): Database {
  const repo = {
    get: (field: string) =>
      ({ id: 'repo-1', name: 'repo-1', title: 'Repository 1', lifecycleStatus, updatedAt: null })[field],
  };
  return {
    getRepository: () => ({
      find: async (options: { filter?: { lifecycleStatus?: string } }) =>
        options.filter?.lifecycleStatus === lifecycleStatus ? [repo] : [],
      findOne: async (options: { filterByTk?: string }) => (options.filterByTk === 'repo-1' ? repo : null),
    }),
  } as unknown as Database;
}

function portalFiles(key: string, title: string): JsPortalWorkspaceFile[] {
  return [
    {
      path: `src/client/js-portals/${key}/entry.json`,
      content: JSON.stringify({ schemaVersion: 1, key, title }),
    },
    { path: `src/client/js-portals/${key}/index.html`, content: '<html><head></head><body>portal</body></html>' },
    { path: `src/client/js-portals/${key}/assets/app.js`, content: 'window.portal = true;' },
  ];
}
