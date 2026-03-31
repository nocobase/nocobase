/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, createMockDatabase } from '@nocobase/database';

describe('string field', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it.skipIf(process.env['DB_DIALECT'] === 'sqlite')('should define string with length options', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [{ type: 'string', name: 'name', length: 10 }],
    });
    await db.sync();

    let err;

    try {
      await Test.repository.create({
        values: {
          name: '123456789011',
        },
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeDefined();
  });

  it('define', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [{ type: 'string', name: 'name' }],
    });
    await db.sync();
    expect(Test.model.rawAttributes['name']).toBeDefined();
    const model = await Test.model.create({
      name: 'abc',
    });
    expect(model.toJSON()).toMatchObject({
      name: 'abc',
    });
  });

  it('set', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [{ type: 'string', name: 'name1' }],
    });
    await db.sync();
    Test.addField('name2', { type: 'string' });
    await db.sync({
      alter: true,
    });
    expect(Test.model.rawAttributes['name1']).toBeDefined();
    expect(Test.model.rawAttributes['name2']).toBeDefined();
    const model = await Test.model.create({
      name1: 'a1',
      name2: 'a2',
    });
    expect(model.toJSON()).toMatchObject({
      name1: 'a1',
      name2: 'a2',
    });
  });

  it('model hook', async () => {
    const collection = db.collection({
      name: 'tests',
      fields: [{ type: 'string', name: 'name' }],
    });
    await db.sync();
    collection.model.beforeCreate((model) => {
      const changed = model.changed();
      for (const name of changed || []) {
        model.set(name, `${model.get(name)}111`);
      }
    });
    collection.addField('name2', { type: 'string' });
    await db.sync({
      alter: true,
    });
    const model = await collection.model.create({
      name: 'n1',
      name2: 'n2',
    });
    expect(model.toJSON()).toMatchObject({
      name: 'n1111',
      name2: 'n2111',
    });
  });

  it('trim', async () => {
    const collection = db.collection({
      name: 'tests',
      fields: [{ type: 'string', name: 'name', trim: true }],
    });
    await db.sync();
    const model = await collection.model.create({
      name: '  n1\n ',
    });
    expect(model.get('name')).toBe('n1');
  });

  it('trim when value is null should be null', async () => {
    const collection = db.collection({
      name: 'tests',
      fields: [{ type: 'string', name: 'name', trim: true }],
    });
    await db.sync();
    const model = await collection.model.create({
      name: null,
    });
    expect(model.get('name')).toBeFalsy();
  });

  it('when value is number should be convert to string', async () => {
    const collection = db.collection({
      name: 'tests',
      fields: [{ type: 'string', name: 'name', trim: true }],
    });
    await db.sync();
    const model = await collection.model.create({
      name: 123,
    });
    expect(model.get('name')).toBe('123');
  });
});
