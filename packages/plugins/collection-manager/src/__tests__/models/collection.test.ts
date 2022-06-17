import { MockServer } from '@nocobase/test';
import { createApp } from '..';

describe('collection model', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createApp();
    await app.install({ clean: true });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('remove', async () => {
    await app
      .agent()
      .resource('collections')
      .create({
        values: {
          name: 'test',
        },
      });
    const collection = app.db.getCollection('test');
    const r1 = await collection.existsInDb();
    expect(r1).toBe(true);
    await app.agent().resource('collections').destroy({
      filterByTk: 'test',
    });
    const r2 = await collection.existsInDb();
    expect(r2).toBe(false);
  });
});
