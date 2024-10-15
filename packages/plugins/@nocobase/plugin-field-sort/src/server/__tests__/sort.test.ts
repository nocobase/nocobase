/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database } from '@nocobase/database';
import { createMockServer, MockServer } from '@nocobase/test';

import Plugin from '..';

describe('sort field', () => {
  let app: MockServer;
  let db: Database;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: [Plugin, 'data-source-main', 'error-handler'],
    });
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should init with camelCase scope key', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'someField',
        },
      ],
    });

    await db.sync();

    await Test.repository.create({
      values: [
        {
          name: 't1',
          someField: 'a',
        },
        {
          name: 't2',
          someField: 'b',
        },
      ],
    });

    Test.setField('scopeKeySort', { type: 'sort', scopeKey: 'someField' });
    await db.sync();
  });

  it('should init sorted value with thousand records', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'group',
        },
      ],
    });

    await db.sync();

    await Test.model.bulkCreate(
      (() => {
        const values = [];
        for (let i = 0; i < 100000; i++) {
          values.push({
            group: 'a',
            name: `r${i}`,
          });

          values.push({
            group: 'b',
            name: `r${i}`,
          });
        }
        return values;
      })(),
    );

    Test.setField('sort', { type: 'sort', scopeKey: 'group' });

    const begin = Date.now();
    await db.sync();
    const end = Date.now();
    // log time cost as milliseconds
    console.log(end - begin);
  });

  it('should init sorted value with null scopeValue', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'group',
        },
      ],
    });

    await db.sync();

    await Test.repository.create({
      values: [
        {
          group: null,
          name: 'r5',
        },
        {
          group: null,
          name: 'r6',
        },
      ],
    });

    Test.setField('sort', { type: 'sort', scopeKey: 'group' });

    await db.sync();
  });

  it('should init sorted value with scopeKey', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'group',
        },
      ],
    });

    await db.sync();
    await Test.repository.create({
      values: [
        {
          group: 'a',
          name: 'r1',
        },
        {
          group: 'b',
          name: 'r2',
        },
        {
          group: 'a',
          name: 'r3',
        },
        {
          group: 'b',
          name: 'r4',
        },
        {
          group: null,
          name: 'r5',
        },
        {
          group: null,
          name: 'r6',
        },
      ],
    });

    Test.setField('sort', { type: 'sort', scopeKey: 'group' });

    await db.sync();

    const records = await Test.repository.find({});
    const r3 = records.find((r) => r.get('name') === 'r3');
    expect(r3.get('sort')).toBe(2);
    const r5 = records.find((r) => r.get('name') === 'r5');
    expect(r5.get('sort')).toBe(1);
  });

  it('should init sorted value by createdAt when primaryKey not exists', async () => {
    const Test = db.collection({
      autoGenId: false,
      name: 'tests',
    });

    await db.sync();
    await Test.repository.create({
      values: [{}, {}, {}],
    });

    // add sort field
    Test.setField('sort', { type: 'sort' });

    let err;
    try {
      await db.sync();
    } catch (e) {
      err = e;
    }
    expect(err).toBeFalsy();
  });

  it('sort', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [{ type: 'sort', name: 'sort' }],
    });
    await db.sync();

    const test1 = await Test.model.create<any>();
    expect(test1.sort).toBe(1);
    const test2 = await Test.model.create<any>();
    expect(test2.sort).toBe(2);
    const test3 = await Test.model.create<any>();
    expect(test3.sort).toBe(3);
  });

  it('should init sort value on data already exits', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
      ],
    });

    await db.sync();

    await db.getRepository('tests').create({
      values: {
        name: 't1',
      },
    });
    await db.getRepository('tests').create({
      values: {
        name: 't2',
      },
    });
    await db.getRepository('tests').create({
      values: {
        name: 't3',
      },
    });

    const field = Test.addField('sort', { type: 'sort' });

    await field.sync({});

    const items = await db.getRepository('tests').find({
      order: ['id'],
    });
    expect(items.map((item) => item.get('sort'))).toEqual([1, 2, 3]);
  });

  test.skip('simultaneously create ', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [{ type: 'sort', name: 'sort' }],
    });

    await db.sync();

    const promise = [];
    for (let i = 0; i < 3; i++) {
      promise.push(Test.model.create());
    }

    await Promise.all(promise);
    const tests = await Test.model.findAll();
    const sortValues = tests.map((t) => t.get('sort')).sort();
    expect(sortValues).toEqual([1, 2, 3]);
  });

  it('skip if sort value not empty', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [{ type: 'sort', name: 'sort' }],
    });
    await db.sync();
    const test1 = await Test.model.create<any>({ sort: 3 });
    expect(test1.sort).toBe(3);
    const test2 = await Test.model.create<any>();
    expect(test2.sort).toBe(4);
    const test3 = await Test.model.create<any>();
    expect(test3.sort).toBe(5);
  });

  it('scopeKey', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [
        { type: 'sort', name: 'sort', scopeKey: 'status' },
        { type: 'string', name: 'status' },
      ],
    });
    await db.sync();

    const t1 = await Test.model.create({ status: 'publish' });
    const t2 = await Test.model.create({ status: 'publish' });
    const t3 = await Test.model.create({ status: 'draft' });
    const t4 = await Test.model.create({ status: 'draft' });

    expect(t1.get('sort')).toBe(1);
    expect(t2.get('sort')).toBe(2);
    expect(t3.get('sort')).toBe(1);
    expect(t4.get('sort')).toBe(2);

    t1.set('status', 'draft');
    await t1.save();

    await t1.reload();
    expect(t1.get('sort')).toBe(3);
  });
});
