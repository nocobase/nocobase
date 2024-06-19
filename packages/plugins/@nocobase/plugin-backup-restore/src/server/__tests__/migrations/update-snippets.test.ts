/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, MigrationContext } from '@nocobase/database';
import updateSnippetName from '../../migrations/20240618103927-update-snippet-name';

import { createMockServer, MockServer } from '@nocobase/test';

describe('migration snippet name test', () => {
  let app: MockServer;
  let db: Database;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['nocobase'],
    });
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should change snippet name', async () => {
    await db.getRepository('roles').create({
      values: {
        name: 'test',
        snippets: ['pm.backup.restore'],
      },
    });

    const migration = new updateSnippetName({ db } as MigrationContext);
    migration.context.app = app;
    await migration.up();

    const role = await db.getRepository('roles').findOne({
      filter: {
        name: 'test',
      },
    });

    expect(role.get('snippets')).toEqual(['pm.backup-restore']);
  });
});
