import { Agent, getAgent, getApp } from '.';
import { Application } from '@nocobase/server';
import Database from '@nocobase/database';

describe('ui_schemas', () => {
  let app: Application;
  let agent: Agent;
  let db: Database;

  beforeEach(async () => {
    app = await getApp();
    db = app.database;
    agent = getAgent(app);
  });

  afterEach(() => app.database.close());

  it('create ui_schemas', async () => {
    const UISchema = db.getModel('ui_schemas');
    const schema = await UISchema.create({
      type: 'void',
      name: 'abc',
      properties: {
        field1: {
          type: 'string',
          'x-component': 'Input',
        },
        field2: {
          type: 'string',
          'x-component': 'Input',
        },
        field3: {
          type: 'array',
          properties: {
            field11: {
              type: 'string',
              'x-component': 'Input',
            },
            field12: {
              type: 'string',
              'x-component': 'Input',
            },
          },
        },
      },
    });
    const properties = await schema.getProperties();
    console.log(JSON.stringify(properties, null, 2));
  });
});
