import { MockServer } from '@nocobase/test';
import { createApp } from '../index';

describe('collections repository', () => {
  let app: MockServer;
  let agent;
  let db;

  beforeEach(async () => {
    app = await createApp();
    db = app.db;

    agent = app.agent();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should get foreign key after create belongs to association', async () => {
    await agent.resource('collections').create({
      values: {
        name: 'users',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
        ],
      },
    });

    await agent.resource('collections').create({
      values: {
        name: 'posts',
        fields: [
          {
            type: 'string',
            name: 'title',
          },
        ],
      },
    });

    await agent.resource('collections.fields', 'posts').create({
      values: {
        name: 'user',
        type: 'belongsTo',
        target: 'users',
        foreignKey: 'userId',
        interface: 'm2o',
      },
    });

    // expect userId field exists in fields collection
    const foreignKeyRecord = await db.getRepository('fields').findOne({
      filter: {
        name: 'userId',
        collectionName: 'posts',
      },
    });

    expect(foreignKeyRecord).toBeDefined();

    // fetch list meta
    const listMetaResp = await agent.resource('collections').listMeta({});
    expect(listMetaResp.status).toBe(200);

    // expect foreign key is added
    const data = listMetaResp.body.data;
    const postData = data.find((item) => item.name === 'posts');

    expect(postData.fields.find((field) => field.name === 'userId')).toBeDefined();
  });
});
