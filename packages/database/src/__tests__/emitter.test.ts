import { getDatabase } from './';
import Database from '../database';

let db: Database;

beforeEach(async () => {
  db = getDatabase();
});

afterEach(async () => {
  await db.close();
});

describe('emitter', () => {
  it('event emitter', async () => {
    db.table({
      name: 'test',
      fields: [
        {
          type: 'json',
          name: 'arr',
          defaultValue: [],
        },
      ],
    });
    db.table({
      name: 'test2',
      fields: [
        {
          type: 'json',
          name: 'arr',
          defaultValue: [],
        },
      ],
    });
    await db.sync();
    const arr = [];
    db.on('afterCreate', async function abc1(...args) {
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log('db.on.afterCreate')
          arr.push(1);
          resolve();
        }, 200);
      });
    });
    db.on('test.afterCreate', async function abc2(model, options) {
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log('db.on.test.afterCreate')
          arr.push(2);
          resolve();
        }, 100);
      });
    });
    db.on('test2.afterCreate', async (model, options) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log('db.on.test2.afterCreate')
          arr.push(3);
          resolve();
        }, 100);
      });
    });
    const Test2 = db.getModel('test2');
    await Test2.create();
    const Test1 = db.getModel('test');
    await Test1.create();
    expect(arr).toEqual([3, 1, 2, 1]);
  });

  it.only('a', async () => {
    db.table({
      name: 'test',
      fields: [
        { type: 'string', name: 'name' }
      ],
    });
    db.on('test.afterBulkCreate', async (...args) => {
      console.log('afterBulkCreate1', args);
    });
    db.on('test2.afterBulkCreate', async (...args) => {
      console.log('afterBulkCreate2', args);
    });
    await db.sync();
    const Test = db.getModel('test');
    await Test.create();
    await Test.bulkCreate([{}, {}]);
    await Test.update({
      name: 'name'
    }, {
      where: {},
    });
    await Test.findAll();
  });
});
