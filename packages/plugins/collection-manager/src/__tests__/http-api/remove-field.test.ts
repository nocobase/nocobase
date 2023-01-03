import { MockServer } from '@nocobase/test';
import { createApp } from '..';

describe('remove field', () => {
  let app: MockServer;
  let agent;

  beforeEach(async () => {
    app = await createApp();
    agent = app.agent();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('can remove fields', async () => {
    await agent.resource('collections').create({
      values: {
        name: 'posts',
        fields: [
          { type: 'string', name: 'f1' },
          { type: 'string', name: 'f2' },
        ],
      },
    });

    const fields = await app.db.getCollection('fields').repository.find();

    const response = await agent.resource('collections.fields', 'posts').destroy({
      filterByTk: fields.map((f) => f.get('key')),
    });

    expect(await app.db.getCollection('fields').repository.count()).toEqual(0);
  });
});
