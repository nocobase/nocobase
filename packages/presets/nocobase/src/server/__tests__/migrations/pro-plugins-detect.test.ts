/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Repository } from '@nocobase/database';
import { MockServer, createMockServer } from '@nocobase/test';
import Migration from '../../migrations/20240424125531-pro-plugins-detect';
import { PluginManager } from '@nocobase/server';

describe('pro plugins detect', () => {
  let app: MockServer;
  let repo: Repository;

  beforeEach(async () => {
    app = await createMockServer({
      version: '0.21.0-alpha.15',
    });
    repo = app.db.getRepository('applicationPlugins');
  });

  afterEach(async () => {
    vi.resetAllMocks();
    await app.db.clean({ drop: true });
    await app.destroy();
  });

  it('should delete removed but not enabled plugins', async () => {
    vi.spyOn(PluginManager, 'getPackageName').mockRejectedValue(new Error('not found'));
    await repo.create({
      values: {
        name: 'saml',
        packageName: '@nocobase/plugin-saml',
        version: '0.21.0-alpha.15',
        enabled: false,
      },
    });
    const migration = new Migration({
      db: app.db,
      // @ts-ignore
      app: app,
    });
    await migration.up();
    const exists = await repo.count({
      filter: {
        name: 'saml',
      },
    });
    expect(exists).toBe(0);
  });

  it('should throw error when enabled plugin not found', async () => {
    vi.spyOn(PluginManager, 'getPackageName').mockRejectedValue(new Error('not found'));
    const plugin = await repo.create({
      values: {
        name: 'saml',
        packageName: '@nocobase/plugin-saml',
        version: '0.21.0-alpha.15',
        enabled: true,
      },
    });
    const migration = new Migration({
      db: app.db,
      // @ts-ignore
      app: app,
    });
    await expect(migration.up()).rejects.toThrowError();
    const p = await repo.findOne({
      filter: {
        id: plugin.id,
      },
    });
    expect(p.name).toBe('saml');
    expect(p.packageName).toBe('@nocobase/plugin-saml');
  });

  it('should rename enabled plugins', async () => {
    vi.spyOn(PluginManager, 'getPackageName').mockResolvedValue('@nocobase/plugin-saml');
    const plugin = await repo.create({
      values: {
        name: 'saml',
        packageName: '@nocobase/plugin-saml',
        version: '0.21.0-alpha.15',
        enabled: true,
      },
    });
    const migration = new Migration({
      db: app.db,
      // @ts-ignore
      app: app,
    });
    await migration.up();
    const p = await repo.findOne({
      filter: {
        id: plugin.id,
      },
    });
    expect(p.name).toBe('auth-saml');
    expect(p.packageName).toBe('@nocobase/plugin-auth-saml');
  });
});
