import { Collection } from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import { createApp } from '..';

describe('collection model', () => {
  let app: MockServer;
  let collection: Collection;

  beforeEach(async () => {
    app = await createApp();
    await app.install({ clean: true });
    await app
      .agent()
      .resource('collections')
      .create({
        values: {
          name: 'test',
        },
      });
    collection = app.db.getCollection('test');
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('remove', async () => {
    await app
      .agent()
      .resource('collections.fields', 'test')
      .create({
        values: {
          type: 'string',
          name: 'name',
        },
      });
    const field = collection.getField('name');
    const r1 = await field.existsInDb();
    expect(r1).toBe(true);
    await app.agent().resource('collections.fields', 'test').destroy({
      filterByTk: 'name',
    });
    const r2 = await field.existsInDb();
    expect(r2).toBe(false);
  });
});
