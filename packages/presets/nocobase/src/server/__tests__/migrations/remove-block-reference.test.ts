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
import Migration from '../../migrations/20260303121000-remove-block-reference';

describe('remove block-reference migration', () => {
  let app: MockServer;
  let repo: Repository;

  beforeEach(async () => {
    app = await createMockServer({
      version: '2.0.0-alpha.1',
    });
    repo = app.db.getRepository('applicationPlugins');
  });

  afterEach(async () => {
    if (!app) {
      return;
    }
    await app.db.clean({ drop: true });
    await app.destroy();
  });

  const runMigration = async () => {
    const migration = new Migration({
      db: app.db,
      app: app as any,
    });
    await migration.up();
  };

  it('should remove legacy plugin record by name', async () => {
    await repo.create({
      values: {
        name: 'block-reference',
        enabled: true,
        installed: true,
      },
    });

    await runMigration();

    const legacyCount = await repo.count({
      filter: {
        name: 'block-reference',
      },
    });
    expect(legacyCount).toBe(0);
  });

  it('should remove legacy plugin record by packageName', async () => {
    await repo.create({
      values: {
        name: 'legacy-block-reference',
        packageName: '@nocobase/plugin-block-reference',
        enabled: true,
        installed: true,
      },
    });

    await runMigration();

    const legacyCount = await repo.count({
      filter: {
        packageName: '@nocobase/plugin-block-reference',
      },
    });
    expect(legacyCount).toBe(0);
  });

  it('should keep ui-templates record', async () => {
    await repo.create({
      values: {
        name: 'block-reference',
        enabled: true,
        installed: true,
      },
    });
    await repo.create({
      values: {
        name: 'ui-templates',
        packageName: '@nocobase/plugin-ui-templates',
        enabled: true,
        installed: true,
      },
    });

    await runMigration();

    const uiTemplates = await repo.findOne({
      filter: {
        name: 'ui-templates',
      },
    });
    expect(uiTemplates).toBeTruthy();
    expect(uiTemplates.packageName).toBe('@nocobase/plugin-ui-templates');
  });

  it('should be idempotent when legacy plugin does not exist', async () => {
    await repo.create({
      values: {
        name: 'ui-templates',
        packageName: '@nocobase/plugin-ui-templates',
        enabled: true,
        installed: true,
      },
    });

    await runMigration();
    await runMigration();

    const uiTemplatesCount = await repo.count({
      filter: {
        name: 'ui-templates',
      },
    });
    const legacyCount = await repo.count({
      filter: {
        $or: [{ name: 'block-reference' }, { packageName: '@nocobase/plugin-block-reference' }],
      },
    });
    expect(uiTemplatesCount).toBe(1);
    expect(legacyCount).toBe(0);
  });
});
