import { Agent, getAgent, getApp } from '.';
import { Application } from '@nocobase/server';
import Database, { ModelCtor, Model } from '@nocobase/database';

describe('collections', () => {
  let app: Application;
  let agent: Agent;
  let db: Database;
  let Collection: ModelCtor<Model>;

  beforeEach(async () => {
    app = await getApp();
    agent = getAgent(app);
    db = app.database;
    Collection = db.getModel('collections');
  });

  afterEach(() => app.database.close());

  it('create', async () => {
    const collection = await Collection.create({
      name: 'test1',
    });
    await collection.updateAssociations({
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'title',
        },
      ],
    });
  });

  it('create2', async () => {
    const collection = await Collection.create({});
    await collection.updateAssociations({
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
        },
      ],
    });
  });

  it('api', async () => {
    await agent.resource('collections').create({
      values: {
        name: 'test2',
      },
    });
    await agent.resource('collections.fields').create({
      associatedKey: 'test2',
      values: {
        type: 'string',
        name: 'name',
      },
    });
  });
});
