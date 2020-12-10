import { Agent, getAgent, getApp } from '../';
import { Application } from '@nocobase/server';
import { options, types } from '../../interfaces';
jest.setTimeout(30000);
import { FieldModel } from '../../models';
describe('models.field', () => {
  let app: Application;
  let agent: Agent;

  beforeEach(async () => {
    app = await getApp();
    agent = getAgent(app);
  });

  afterEach(() => app.database.close());

  it('updatedAt', async () => {
    const Field = app.database.getModel('fields');
    const field = new Field();
    field.setInterface('updatedAt');
    expect(field.get()).toMatchObject(types.updatedAt.options)
  });

  it('dataSource', async () => {
    const Collection = app.database.getModel('collections');
    // @ts-ignore
    const collection = await Collection.create({
      title: 'tests',
    });
    await collection.updateAssociations({
      fields: [
        {
          title: 'xx',
          name: 'xx',
          interface: 'select',
          type: 'virtual',
          dataSource: [
            {label: 'xx', value: 'xx'},
          ],
          component: {
            type: 'string',
            showInDetail: true,
            showInForm: true,
          },
        }
      ],
    });
    const fields = await collection.getFields();
    expect(fields[0].get('dataSource')).toEqual([
      {label: 'xx', value: 'xx'},
    ]);
  });
});
