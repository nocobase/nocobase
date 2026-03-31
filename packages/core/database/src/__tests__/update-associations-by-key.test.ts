/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '../database';
import { createMockDatabase } from '../mock-database';

describe('association tests by key', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('belongsToMany: should update associations by key, ignore non-existent target', async () => {
    const assoc1 = db.collection({
      name: 'assoc1',
      fields: [{ name: 'name', type: 'string', unique: true }],
    });

    const test = db.collection({
      name: 'test',
      fields: [
        { name: 'name', type: 'string', unique: true },
        { name: 'title', type: 'string' },
        { name: 'text', type: 'string' },
        {
          name: 'assoc1',
          type: 'belongsToMany',
          target: 'assoc1',
          sourceKey: 'name',
          targetKey: 'name',
        },
      ],
    });

    await db.sync();

    await expect(
      db.getRepository('test').create({
        values: {
          name: 'test1',
          // assoc1 中不存在 'assoc1-1'
          assoc1: ['assoc1-1'],
        },
      }),
    ).resolves.toBeDefined();
  });

  it('hasOne: should set association by target primary key and ignore if target non-existent', async () => {
    const assoc2 = db.collection({
      name: 'assoc2',
      autoGenId: false,
      fields: [
        { name: 'code', type: 'string', primaryKey: true }, // 👈 主键
      ],
    });

    const test2 = db.collection({
      name: 'test2',
      autoGenId: false,
      fields: [
        { name: 'code', type: 'string', primaryKey: true },
        { name: 'description', type: 'string' },
        {
          name: 'assoc2',
          type: 'hasOne',
          target: 'assoc2',
          // 外键写在 assoc2 表上
          foreignKey: 'ownerCode',
          sourceKey: 'code',
        },
      ],
    });

    await db.sync();

    await expect(
      db.getRepository('test2').create({
        values: {
          code: 'T2-001',
          assoc2: 'A2-001', // 作为目标主键
        },
      }),
    ).resolves.toBeDefined();
  });

  it('hasMany: should set multiple associations by key and ignore non-existent targets', async () => {
    const assoc3 = db.collection({
      name: 'assoc3',
      fields: [{ name: 'slug', type: 'string', unique: true }],
    });

    const test3 = db.collection({
      name: 'test3',
      fields: [
        { name: 'slug', type: 'string', unique: true },
        { name: 'name', type: 'string' },
        {
          name: 'assoc3',
          type: 'hasMany',
          target: 'assoc3',
          sourceKey: 'slug',
          targetKey: 'slug',
        },
      ],
    });

    await db.sync();

    await expect(
      db.getRepository('test3').create({
        values: {
          slug: 'TS3-100',
          name: 'Sample3',
          // assoc3 中不存在 'A3-001'、'A3-002'
          assoc3: ['A3-001', 'A3-002'],
        },
      }),
    ).resolves.toBeDefined();
  });

  it('belongsTo: should set the association by key and ignore if target non-existent', async () => {
    const assoc4 = db.collection({
      name: 'assoc4',
      fields: [{ name: 'identifier', type: 'string', unique: true }],
    });

    const test4 = db.collection({
      name: 'test4',
      fields: [
        { name: 'identifier', type: 'string', unique: true },
        { name: 'value', type: 'string' },
        {
          name: 'assoc4',
          type: 'belongsTo',
          target: 'assoc4',
          sourceKey: 'identifier',
          targetKey: 'identifier',
        },
      ],
    });

    await db.sync();

    await expect(
      db.getRepository('test4').create({
        values: {
          identifier: 'T4-900',
          value: 'Val900',
          // assoc4 中不存在 'A4-900'
          assoc4: 'A4-900',
        },
      }),
    ).resolves.toBeDefined();
  });
});
