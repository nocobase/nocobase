import { Database, MigrationContext, mockDatabase } from '@nocobase/database';
import UpdateCollectionsHiddenMigration from '../../migrations/20221104151410-update-collections-hidden';

import { createApp } from '../index';
import { MockServer } from '@nocobase/test';

describe('migration 20221104151410-update-collections-hidden test', () => {
  let app: MockServer;
  let db: Database;

  beforeEach(async () => {
    app = await createApp();
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });
  it('20221104151410-update-collections-hidden up method test', async () => {
    await db.getCollection('collections').model.create({
      name: 'test',
      options: {
        autoCreate: true,
        isThrough: true,
      },
      hidden: false,
    });

    const result = await db.getRepository('collections').findOne({
      filter: {
        name: 'test',
      },
    });
    expect(result.get('hidden')).toBeFalsy();

    const migration = new UpdateCollectionsHiddenMigration({ db } as MigrationContext);
    migration.context.app = app;
    await migration.up();

    const upResult = await db.getRepository('collections').findOne({
      filter: {
        name: 'test',
      },
    });
    expect(upResult.get('hidden')).toBeTruthy();
  });
});
