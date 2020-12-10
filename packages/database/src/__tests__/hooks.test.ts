import { getDatabase } from './';
import Database from '../database';
import Table from '../table';
import Model from '../model';
import { FieldContext, Integer, registerField } from '../fields';

class TestHookField extends Integer {
  constructor(options: any, context: FieldContext) {
    super(options, context);
    const Model = context.sourceTable.getModel();
    Model.addHook('beforeCreate', (model) => {
      model.set('name', 'beforeCreate123');
      console.log('beforeCreate123');
    });
    Model.addHook('afterCreate', (model) => {
      model.set('title', 'afterCreate123');
      console.log('afterCreate123');
    });
  }
}

registerField('testHook', TestHookField);

let db: Database;

beforeEach(async () => {
  db = getDatabase();
});

afterEach(async () => {
  await db.close();
});

describe('hooks', () => {
  it('add hook in custom field', async () => {
    db.table({
      name: 'testHook',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'testHook',
          name: 'testHook',
        },
        {
          type: 'string',
          name: 'title',
        },
      ],
    });
    await db.sync();
    const TestHook = db.getModel('testHook');
    const test = await TestHook.create({});
    expect(test.get('name')).toBe('beforeCreate123');
  });

  it('add hook in custom field', async () => {
    const table = db.table({
      name: 'test2',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
      ],
    });
    // 通过 table 新增
    table.addField({
      type: 'testHook',
      name: 'testHook',
    });
    table.addField({
      type: 'string',
      name: 'title',
    });
    await table.sync();
    const Test2 = db.getModel('test2');
    const test = await Test2.create({});
    expect(test.get('name')).toBe('beforeCreate123');
    expect(test.get('title')).toBe('afterCreate123');
  });
});
