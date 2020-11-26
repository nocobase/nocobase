import { Agent, getAgent, getApp } from '.';
import { Application } from '@nocobase/server';

describe('collection hooks', () => {
  let app: Application;
  let agent: Agent;

  beforeEach(async () => {
    app = await getApp();
    agent = getAgent(app);
  });

  afterEach(() => app.database.close());

  it('create table', async () => {
    const response = await agent.resource('collections').create({
      values: {
        name: 'tests',
        title: 'tests',
      },
    });
    
    const table = app.database.getTable('tests');
    expect(table).toBeDefined();
  });

  it('create table without name', async () => {
    const created = await agent.resource('collections').create({
      values: {
        title: 'tests',
      },
    });
    
    const { name } = created.body;
    const table = app.database.getTable(name);
    expect(table).toBeDefined();
    expect(table.getOptions().title).toBe('tests');

    const list = await agent.resource('collections').list();
    expect(list.body.rows.length).toBe(1);

    await table.getModel().drop();
  });

  it('list fields', async () => {
    const response = await agent.resource('collections.fields').list({
      associatedKey: 'tests',
      // values: {
      //   type: 'string',
      //   name: 'title',
      //   title: '标题',
      // },
    });
    console.log(response.body);
  });

  it('create field', async () => {
    const response = await agent.resource('collections.fields').create({
      associatedKey: 'tests',
      values: {
        type: 'string',
        name: 'name',
        options: {
          type: 'string',
          name: 'name',
        },
      },
    });
    console.log(response.body);
  });
});
