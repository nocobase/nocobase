import { Agent, getAgent, getApp } from '..';
import { Application } from '@nocobase/server';
import { types } from '../../interfaces';

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
    const response = await agent.resource('collections').create({
      values: {
        title: 'tests',
      },
    });

    const { name } = response.body;
    const table = app.database.getTable(name);
    expect(table).toBeDefined();
    expect(table.getOptions().title).toBe('tests');

    const list = await agent.resource('collections').list();
    expect(list.body.rows.length).toBe(1);

    await table.getModel().drop();
  });
});
