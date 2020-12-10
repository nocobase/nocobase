import { getDatabase } from './';
import Database from '../database';
import Table from '../table';
import Model from '../model';
import { FieldContext, INTEGER, registerField } from '../fields';

class TestHookField extends INTEGER {
  constructor(options: any, context: FieldContext) {
    super(options, context);
    const Model = context.sourceTable.getModel();
    Model.addHook('beforeCreate', (model) => {
      const arr = model.get('arr') as any[];
      arr.push(1);
      model.set('arr', arr);
      console.log('beforeCreate in field');
    });
    Model.addHook('afterCreate', (model) => {
      model.set('title', 'afterCreate123');
      const arr = model.get('arr') as any[];
      arr.push(2);
      model.set('arr', arr);
      console.log('afterCreate in field');
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
          type: 'json',
          name: 'arr',
          defaultValue: [],
        },
        {
          type: 'testHook',
          name: 'testHook',
        },
      ],
    });
    await db.sync();
    const TestHook = db.getModel('testHook');
    const test = await TestHook.create({});
    expect(test.get('arr')).toEqual([1,2]);
  });

  it('add hook in custom field', async () => {
    db.table({
      name: 'test1',
      fields: [
        {
          type: 'testHook',
          name: 'testHook',
        },
        {
          type: 'json',
          name: 'arr',
          defaultValue: [],
        },
      ],
      hooks: {
        beforeCreate(model) {
          model.set('name', 'beforeCreate1');
          const arr = model.get('arr') as any[];
          arr.push(3);
          model.set('arr', arr);
          console.log('beforeCreate in table');
        },
        afterCreate(model) {
          model.set('name', 'afterCreate1');
          const arr = model.get('arr') as any[];
          arr.push(4);
          model.set('arr', arr);
          console.log('afterCreate in table');
        },
      },
    });
    await db.sync();
    const Test1 = db.getModel('test1');
    const test = await Test1.create({});
    console.log(test.get('arr'));
    expect(test.get('arr')).toEqual([3,1,4,2]);
  });

  it('add hook in custom field', async () => {
    const table = db.table({
      name: 'test2',
      fields: [
        {
          type: 'json',
          name: 'arr',
          defaultValue: [],
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
    expect(test.get('arr')).toEqual([1,2]);
  });

  it.only('add hook in custom field', async () => {
    const table = db.table({
      name: 'test3',
      fields: [
        {
          type: 'json',
          name: 'arr',
          defaultValue: [],
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
    const Test3 = db.getModel('test3');
    Test3.beforeCreate((model) => {
      const arr = model.get('arr') as any[];
      arr.push(3);
      model.set('arr', arr);
    });
    Test3.afterCreate((model) => {
      const arr = model.get('arr') as any[];
      arr.push(4);
      model.set('arr', arr);
    });
    const test = await Test3.create({});
    expect(test.get('arr')).toEqual([ 1, 3, 2, 4 ]);
  });

  it('add hook in custom field', async () => {
    const table = db.table({
      name: 'test3',
      fields: [
        {
          type: 'json',
          name: 'arr',
          defaultValue: [],
        },
      ],
      hooks: {
        beforeCreate(model) {
          model.set('name', 'beforeCreate1');
          const arr = model.get('arr') as any[];
          arr.push(3);
          model.set('arr', arr);
          console.log('beforeCreate in table');
        },
        afterCreate(model) {
          model.set('name', 'afterCreate1');
          const arr = model.get('arr') as any[];
          arr.push(4);
          model.set('arr', arr);
          console.log('afterCreate in table');
        },
      },
    });
    table.addField({
      type: 'string',
      name: 'title',
    });
    // await table.sync();
    let Test3 = db.getModel('test3');
    Test3.beforeCreate((model) => {
      const arr = model.get('arr') as any[];
      arr.push(5);
      model.set('arr', arr);
    });
    Test3.afterCreate((model) => {
      const arr = model.get('arr') as any[];
      arr.push(6);
      model.set('arr', arr);
    });
    // 通过 table 新增
    table.addField({
      type: 'testHook',
      name: 'testHook',
    });
    await table.sync();
    Test3 = db.getModel('test3');
    const test = await Test3.create({});
    expect(test.get('arr')).toEqual([ 3, 5, 1, 4, 6, 2 ]);
  });
});
