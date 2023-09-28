import { Database, MigrationContext } from '@nocobase/database';
import { MockServer, pgOnly } from '@nocobase/test';
import Migrator from '../../migrations/20230918024546-set-collection-schema';
import { createApp } from '../index';

pgOnly()('set collection schema', () => {
  let app: MockServer;
  let db: Database;

  beforeEach(async () => {
    app = await createApp({});

    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should set collection schema', async () => {
    const collection = await db.getRepository('collections').create({
      values: {
        name: 'testCollection',
      },
    });

    await collection.set('schema', undefined);
    await collection.save();

    expect(collection.options.schema).toBeUndefined();

    const migration = new Migrator({ db } as MigrationContext);
    migration.context.app = app;
    await migration.up();

    const collection2 = await db.getRepository('collections').findOne({});

    expect(collection2.options.schema).toEqual(
      process.env.COLLECTION_MANAGER_SCHEMA || app.db.options.schema || 'public',
    );
  });
});
