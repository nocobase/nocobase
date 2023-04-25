import { Database, MigrationContext } from '@nocobase/database';
import UpdateCollectionsHiddenMigration from '../../migrations/20221104151410-update-collections-hidden';

import { MockServer } from '@nocobase/test';
import { createApp } from '../index';

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
    await db.getCollection('collections').model.create({
      name: 'test1',
      hidden: false,
    });
    await db.getCollection('collections').model.create({
      name: 'test2',
      options: {
        isThrough: true,
      },
      hidden: false,
    });

    const result = await db.getRepository('collections').find({
      filter: {
        name: 'test',
      },
    });
    expect(result.length).toBe(1);
    expect(result[0].get('hidden')).toBeFalsy();

    // > 0.8.0-alpha.9 version up test
    await db.getRepository('applicationVersion').update({
      filterByTk: 1,
      values: {
        value: '0.8.0-alpha.10',
      },
    });
    const migration = new UpdateCollectionsHiddenMigration({ db } as MigrationContext);
    migration.context.app = app;
    await migration.up();

    let upResult = await db.getRepository('collections').find({
      filter: {
        name: 'test',
      },
    });

    expect(upResult[0].get('hidden')).toBeFalsy();

    let hiddenResult = await db.getRepository('collections').find({
      filter: {
        hidden: true,
      },
    });
    expect(hiddenResult.length).toBe(0);

    // <= 0.8.0-alpha.9 version up test
    await db.getRepository('applicationVersion').update({
      filterByTk: 1,
      values: {
        value: '0.8.0-alpha.9',
      },
    });
    await migration.up();

    upResult = await db.getRepository('collections').find({
      filter: {
        name: 'test',
      },
    });

    expect(upResult[0].get('hidden')).toBeTruthy();

    hiddenResult = await db.getRepository('collections').find({
      filter: {
        hidden: true,
      },
    });
    expect(hiddenResult.length).toBe(1);
  });
});
