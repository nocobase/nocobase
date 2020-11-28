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
    await agent.resource('collections').create({
      values: {
        name: 'tests',
        title: 'tests',
      },
    });
    
    await agent.resource('collections.fields').create({
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
    
    const table = app.database.getTable('tests');
    expect(table.getOptions().fields.find(({ name }) => name === 'name')).toBeDefined();

    const { body } = await agent.resource('tests').create({
      values: { name: 'a' }
    });

    expect(body.name).toBe('a');
  });

  it('create field without name', async () => {
    await agent.resource('collections').create({
      values: {
        name: 'tests',
        title: 'tests',
      },
    });
    
    const createdField = await agent.resource('collections.fields').create({
      associatedKey: 'tests',
      values: {
        type: 'string',
      },
    });
    const { name: createdFieldName } = createdField.body;

    const table = app.database.getTable('tests');
    expect(table.getOptions().fields.find(({ name }) => name === createdFieldName)).toBeDefined();

    const createdRow = await agent.resource('tests').create({
      values: { [createdFieldName]: 'a' }
    });

    expect(createdRow.body[createdFieldName]).toBe('a');
  });

  it('create string field by interface', async () => {
    await agent.resource('collections').create({
      values: {
        name: 'tests',
        title: 'tests',
      },
    });

    const createdField = await agent.resource('collections.fields').create({
      associatedKey: 'tests',
      values: {
        interface: 'string',
        title: '名称',
        required: true,
        // viewable: true,
        // sortable: true,
        // filterable: true
      },
    });
    const { type } = createdField.body;
    expect(type).toBe('string');
  });
});
