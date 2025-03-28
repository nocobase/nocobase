/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, createMockDatabase } from '@nocobase/database';

describe('update associations', () => {
  let db: Database;
  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should update associations with target key', async () => {
    const T1 = db.collection({
      name: 'test1',
      autoGenId: false,
      timestamps: false,
      filterTargetKey: 'id_',
      fields: [
        {
          name: 'id_',
          type: 'string',
        },
        {
          type: 'hasMany',
          name: 't2',
          foreignKey: 'nvarchar2',
          targetKey: 'varchar_',
          sourceKey: 'id_',
          target: 'test2',
        },
      ],
    });

    const T2 = db.collection({
      name: 'test2',
      autoGenId: false,
      timestamps: false,
      filterTargetKey: 'varchar_',
      fields: [
        {
          name: 'varchar_',
          type: 'string',
          unique: true,
        },
        {
          name: 'nvarchar2',
          type: 'string',
        },
      ],
    });

    await db.sync();

    const t2 = await T2.repository.create({
      values: {
        varchar_: '1',
      },
    });

    await T1.repository.create({
      values: {
        id_: 1,
        t2: [
          {
            varchar_: '1',
          },
        ],
      },
    });

    const t1 = await T1.repository.findOne({
      appends: ['t2'],
    });

    expect(t1['t2'][0]['varchar_']).toBe('1');
  });

  it('hasOne', async () => {
    db.collection({
      name: 'a',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'hasOne',
          name: 'b',
          target: 'b',
        },
      ],
    });
    db.collection({
      name: 'b',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'hasOne',
          name: 'c',
          target: 'c',
        },
      ],
    });
    db.collection({
      name: 'c',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'hasOne',
          name: 'd',
          target: 'd',
        },
      ],
    });
    db.collection({
      name: 'd',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
      ],
    });
    await db.sync();
    const b = await db.getRepository('b').create({
      values: {},
    });
    const c = await db.getRepository('c').create({
      values: {},
    });
    const d = await db.getRepository('d').create({
      values: {},
    });
    await db.getRepository('a').create({
      updateAssociationValues: ['b'],
      values: {
        name: 'a1',
        b: {
          id: b.id,
          c: {
            id: c.id,
            d: {
              id: d.id,
            },
          },
        },
      },
    });
    const d1 = await d.reload();
    expect(d1.cId).toBe(c.id);

    const b2 = await db.getRepository('b').create({
      values: {},
    });
    const c2 = await db.getRepository('c').create({
      values: {},
    });
    const d2 = await db.getRepository('d').create({
      values: {},
    });
    await db.getRepository('a').create({
      values: {
        name: 'a1',
        b: {
          id: b2.id,
          c: {
            id: c2.id,
            d: {
              id: d2.id,
            },
          },
        },
      },
    });
    const c22 = await c2.reload();
    expect(c22.bId).toBeNull();
    const d22 = await d2.reload();
    expect(d22.cId).toBeNull();
  });

  it('hasMany', async () => {
    db.collection({
      name: 'a',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'hasMany',
          name: 'b',
          target: 'b',
        },
      ],
    });
    db.collection({
      name: 'b',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'hasMany',
          name: 'c',
          target: 'c',
        },
      ],
    });
    db.collection({
      name: 'c',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'hasMany',
          name: 'd',
          target: 'd',
        },
      ],
    });
    db.collection({
      name: 'd',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
      ],
    });

    await db.sync();
    const b = await db.getRepository('b').create({
      values: {},
    });
    const c = await db.getRepository('c').create({
      values: {},
    });
    const d = await db.getRepository('d').create({
      values: {},
    });
    await db.getRepository('a').create({
      updateAssociationValues: ['b'],
      values: {
        name: 'a1',
        b: {
          id: b.id,
          c: {
            id: c.id,
            d: {
              id: d.id,
            },
          },
        },
      },
    });
    const d1 = await d.reload();
    expect(d1.cId).toBe(c.id);
    const b2 = await db.getRepository('b').create({
      values: {},
    });
    const c2 = await db.getRepository('c').create({
      values: {},
    });
    const d2 = await db.getRepository('d').create({
      values: {},
    });
    await db.getRepository('a').create({
      values: {
        name: 'a1',
        b: {
          id: b2.id,
          c: {
            id: c2.id,
            d: {
              id: d2.id,
            },
          },
        },
      },
    });
    const c22 = await c2.reload();
    expect(c22.bId).toBeNull();
    const d22 = await d2.reload();
    expect(d22.cId).toBeNull();
  });
});
