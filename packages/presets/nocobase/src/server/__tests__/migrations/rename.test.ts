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
import Migration from '../../migrations/20240424131556-rename';

describe('rename', () => {
  let app: MockServer;
  let repo: Repository;

  beforeEach(async () => {
    app = await createMockServer({
      version: '0.21.0-alpha.15',
    });
    repo = app.db.getRepository('applicationPlugins');
  });

  afterEach(async () => {
    await app.db.clean({ drop: true });
    await app.destroy();
  });

  it('should rename', async () => {
    const plugin = await repo.create({
      values: {
        name: 'collection-manager',
        version: '0.21.0-alpha.15',
        enabled: true,
        installed: true,
        builtIn: true,
      },
    });
    const migration = new Migration({
      // @ts-ignore
      app,
    });
    await migration.up();
    const p = await repo.findOne({
      filter: {
        id: plugin.id,
      },
    });
    expect(p.name).toBe('data-source-main');
    expect(p.packageName).toBe('@nocobase/plugin-data-source-main');
  });
});
