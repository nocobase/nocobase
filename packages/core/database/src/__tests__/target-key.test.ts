/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase, Database } from '@nocobase/database';

describe('targetKey', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  test('default targetKey', async () => {
    db.collection({
      name: 'a1',
      fields: [
        {
          type: 'hasMany',
          name: 'b1',
          target: 'b1',
        },
      ],
    });
    db.collection({
      name: 'b1',
      fields: [],
    });
    await db.sync();
    const r1 = db.getRepository('a1');
    const r2 = db.getRepository('b1');
    const b1 = await r2.create({
      values: {},
    });
    await r1.create({
      updateAssociationValues: ['b1'],
      values: {
        name: 'a1',
        b1: [b1.toJSON()],
      },
    });
    const b1r = await b1.reload();
    expect(b1r.a1Id).toBe(b1.id);
  });

  test('targetKey=code', async () => {
    db.collection({
      name: 'a1',
      fields: [
        {
          type: 'hasMany',
          name: 'b1',
          target: 'b1',
          targetKey: 'code',
        },
      ],
    });
    db.collection({
      name: 'b1',
      fields: [
        {
          type: 'string',
          name: 'code',
        },
      ],
    });
    await db.sync();

    const r1 = db.getRepository('a1');
    const r2 = db.getRepository('b1');

    const b1 = await r2.create({
      values: {},
    });

    await r1.create({
      updateAssociationValues: ['b1'],
      values: {
        name: 'a1',
        b1: [b1.toJSON()],
      },
    });

    const b1r = await b1.reload();

    expect(b1r.a1Id).toBe(b1.id);
  });

  test('should throw an error', async () => {
    db.collection({
      name: 'a1',
      fields: [
        {
          type: 'hasMany',
          name: 'b1',
          target: 'b1',
          targetKey: 'code',
        },
      ],
    });
    db.collection({
      name: 'b1',
      fields: [
        {
          type: 'string',
          name: 'code',
          unique: true,
        },
      ],
    });
    await db.sync();
    const r1 = db.getRepository('a1');
    const r2 = db.getRepository('b1');
    const b1 = await r2.create({
      values: {},
    });
    await expect(async () => {
      await r1.create({
        updateAssociationValues: ['b1'],
        values: {
          name: 'a1',
          b1: [b1.toJSON()],
        },
      });
    }).rejects.toThrowError('code field value is empty');
  });

  test('should find by code', async () => {
    db.collection({
      name: 'a1',
      fields: [
        {
          type: 'hasMany',
          name: 'b1',
          target: 'b1',
          targetKey: 'code',
        },
      ],
    });
    db.collection({
      name: 'b1',
      fields: [
        {
          type: 'string',
          name: 'code',
          unique: true,
        },
      ],
    });
    await db.sync();
    const r1 = db.getRepository('a1');
    const r2 = db.getRepository('b1');
    const b1 = await r2.create({
      values: {
        code: 'code1',
      },
    });
    await r1.create({
      updateAssociationValues: ['b1'],
      values: {
        name: 'a1',
        b1: [b1.toJSON()],
      },
    });
    const b1r = await b1.reload();
    expect(b1r.a1Id).toBe(b1.id);
  });

  test('should find by a1Code and code', async () => {
    db.collection({
      name: 'a1',
      fields: [
        {
          type: 'string',
          name: 'code',
          unique: true,
        },
        {
          type: 'hasMany',
          name: 'b1',
          target: 'b1',
          sourceKey: 'code',
          foreignKey: 'a1Code',
          targetKey: 'code',
        },
      ],
    });
    db.collection({
      name: 'b1',
      indexes: [
        {
          type: 'UNIQUE',
          fields: ['a1Code', 'code'],
        },
      ],
      fields: [
        {
          type: 'string',
          name: 'a1Code',
        },
        {
          type: 'string',
          name: 'code',
        },
      ],
    });
    await db.sync();
    const r1 = db.getRepository('a1');
    const r2 = db.getRepository('b1');
    await r2.create({
      values: {
        code: 'b1',
      },
    });
    const b1 = await r2.create({
      values: {
        code: 'b1',
      },
    });
    await r1.create({
      updateAssociationValues: ['b1'],
      values: {
        code: 'a1',
        b1: [b1.toJSON()],
      },
    });
    const b1r = await b1.reload();
    expect(b1r.a1Code).toBe('a1');
    expect(b1r.code).toBe('b1');
  });
});
