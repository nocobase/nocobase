import { Agent, getAgent, getApp } from '.';
import { Application } from '@nocobase/server';
import Database from '@nocobase/database';

describe('collection hooks', () => {
  let app: Application;
  let agent: Agent;
  let db: Database;

  beforeEach(async () => {
    app = await getApp();
    db = app.database;
    agent = getAgent(app);
  });

  afterEach(() => app.database.close());

  it('create table', async () => {
    const Collection = db.getModel('collections');
    const collection = await Collection.create({
      title: 'tests',
      // name: 'tests',
    });
    await collection.updateAssociations({
      fields: [
        {
          name: 'title',
          dataType: 'string',
        },
        {
          name: 'content',
          dataType: 'text',
        },
        {
          dataType: 'integer',
        },
      ],
    });
  });
});
