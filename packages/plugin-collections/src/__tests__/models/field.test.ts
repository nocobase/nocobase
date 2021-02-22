import { Agent, getAgent, getApp } from '../';
import { Application } from '@nocobase/server';
import { types } from '../../interfaces';

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

  it.skip('sub table field', async () => {
    const [Collection, Field] = app.database.getModels(['collections', 'fields']);
    const options = {
      title: 'tests',
      name: 'tests',
      fields: [
        {
          interface: 'subTable',
          title: '子表格',
          name: 'subs',
          children: [
            {
              interface: 'string',
              title: '名称',
              name: 'name',
            },
          ],
        },
      ],
    };
    const collection = await Collection.create(options);
    await collection.updateAssociations(options);
    const field = await Field.findOne({
      where: {
        title: '子表格',
      },
    });
    await field.createChild({
      interface: 'string',
      title: '名称',
      name: 'title',
    });
    const Test = app.database.getModel('tests');
    const Sub = app.database.getModel('subs');
    // console.log(Test.associations);
    // console.log(Sub.rawAttributes);
    const test = await Test.create({});
    const sub = await test.createSub({name: 'name1', title: 'title1'});
    expect(sub.toJSON()).toMatchObject({name: 'name1', title: 'title1'})
  });

  it('sub table field', async () => {
    const [Collection, Field] = app.database.getModels(['collections', 'fields']);
    // @ts-ignore
    const options = {
      title: 'tests',
      name: 'tests',
      fields: [
        {
          interface: 'subTable',
          title: '子表格',
          // name: 'subs',
          children: [
            {
              interface: 'string',
              title: '名称',
              // name: 'name',
            },
          ],
        },
      ],
    };
    const collection = await Collection.create(options);
    await collection.updateAssociations(options);
    const field = await Field.findOne({
      where: {
        title: '子表格',
      },
    });
    await field.createChild({
      interface: 'string',
      title: '名称',
      name: 'title',
    });
  });
});
