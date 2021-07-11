import { Agent, getAgent, getApp } from '../';
import { Application } from '@nocobase/server';
import * as types from '../../interfaces/types';

describe('models.collection', () => {
  let app: Application;
  let agent: Agent;

  beforeEach(async () => {
    app = await getApp();
    agent = getAgent(app);
  });

  afterEach(() => app.database.close());

  it('import all tables', async () => {
    const tables = app.database.getTables([]);
    for (const table of tables) {
      const Collection = app.database.getModel('collections');
      await Collection.import(table.getOptions(), { migrate: false });
    }
  });

  it('import examples', async () => {
    await app.database.getModel('collections').import({
      title: '示例',
      name: 'examples',
      showInDataMenu: true,
      statusable: false,
      fields: [
        {
          interface: 'string',
          title: '单行文本',
          name: 'string',
          component: {
            showInTable: true,
            showInDetail: true,
            showInForm: true,
          },
        },
        {
          interface: 'textarea',
          title: '多行文本',
          name: 'textarea',
          component: {
            showInTable: true,
            showInDetail: true,
            showInForm: true,
          },
        },
      ],
    }, {
      // migrate: false,
    });
    const table = app.database.getTable('examples');
    expect(table).toBeDefined();
    expect(table.getFields().size).toBe(2);
    await table.sync();
    const Example = app.database.getModel('examples');
    const example = await Example.create({
      string: 'string1',
      textarea: 'textarea1',
    });
    expect(example.toJSON()).toMatchObject({
      string: 'string1',
      textarea: 'textarea1',
    });
  });
});
