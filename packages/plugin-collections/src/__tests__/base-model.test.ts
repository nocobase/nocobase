import Database, { ModelCtor } from '@nocobase/database';
import { getDatabase } from '.';
import BaseModel from '../models/base';

describe('base model', () => {
  let database: Database;
  let TestModel: ModelCtor<BaseModel>;
  let test: BaseModel;
  beforeEach(async () => {
    database = getDatabase();
    database.table({
      name: 'tests',
      model: BaseModel,
      additionalAttribute: 'options',
      fields: [
        {
          name: 'name',
          type: 'string',
        },
        {
          type: 'json',
          name: 'component',
          defaultValue: {},
        },
        {
          type: 'json',
          name: 'options',
          defaultValue: {},
        },
      ],
    });
    await database.sync();
    TestModel = database.getModel('tests') as ModelCtor<BaseModel>;
    test = await TestModel.create({
      name: '123',
      abc: {aa: 'aa'},
      'abc.bb': 'bb',
      component: {
        a: 'a',
      },
      'component.b': 'b',
      options: {
        bcd: 'bbb',
      },
      arr: [{a: 'a'}, {b: 'b'}],
    });
  });

  afterEach(() => database.close());

  it('get all attribute', async () => {
    // 获取所有字段
    expect(test.get()).toMatchObject({
      abc: { aa: 'aa', bb: 'bb' },
      bcd: 'bbb',
      name: '123',
      component: { a: 'a', b: 'b' },
      arr: [{a: 'a'}, {b: 'b'}],
    });
  });

  it('get options attribute', async () => {
    // 直接取 options 字段
    expect(test.get('options')).toEqual({
      abc: {
        aa: 'aa',
        bb: 'bb',
      },
      bcd: 'bbb',
      arr: [{a: 'a'}, {b: 'b'}],
    });
  });

  it('get component attribute', async () => {
    expect(test.get('component')).toEqual({ a: 'a', b: 'b' });
  });

  it('set component attribute with dot key', async () => {
    test.set('component.c', 'c');
    await test.save();
    expect(test.get()).toMatchObject({
      abc: { aa: 'aa', bb: 'bb' },
      bcd: 'bbb',
      name: '123',
      component: { a: 'a', b: 'b' },
      arr: [{a: 'a'}, {b: 'b'}],
    });
    expect(test.get('component')).toEqual({ a: 'a', b: 'b', c: 'c' });
  });

  it('set options attribute with dot key', async () => {
    test.set('options.cccc', 'cccc');
    await test.save();
    expect(test.get()).toMatchObject({
      abc: { aa: 'aa', bb: 'bb' },
      bcd: 'bbb',
      name: '123',
      cccc: 'cccc',
      component: { a: 'a', b: 'b' },
      arr: [{a: 'a'}, {b: 'b'}],
    });
  });

  it('set options attribute without options prefix', async () => {
    test.set('dddd', 'dddd');
    await test.save();
    expect(test.get()).toMatchObject({
      abc: { aa: 'aa', bb: 'bb' },
      bcd: 'bbb',
      name: '123',
      dddd: 'dddd',
      component: { a: 'a', b: 'b' },
      arr: [{a: 'a'}, {b: 'b'}],
    });
  });

  it('refind', async () => {
    test.set('component.c', 'c');
    await test.save();
    // 重新查询
    const test2 = await TestModel.findByPk(test.id);
    expect(test2.get()).toMatchObject({
      abc: { aa: 'aa', bb: 'bb' },
      bcd: 'bbb',
      name: '123',
      component: { a: 'a', b: 'b', c: 'c' },
      arr: [{a: 'a'}, {b: 'b'}],
    });
    expect(test2.get('component')).toEqual({ a: 'a', b: 'b', c: 'c' });
  });

  it('update', async () => {
    await test.update({
      'name123': 'xxx',
      'component.d': 'd',
    });
    expect(test.get()).toMatchObject({
      abc: { aa: 'aa', bb: 'bb' },
      bcd: 'bbb',
      name: '123',
      name123: 'xxx',
      component: { a: 'a', b: 'b', d: 'd' },
      arr: [{a: 'a'}, {b: 'b'}],
    });
  });
});
