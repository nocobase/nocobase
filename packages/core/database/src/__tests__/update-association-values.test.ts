/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, createMockDatabase } from '@nocobase/database';
import { vi } from 'vitest';

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

  it('should not create new records when association data contains only non-id fields', async () => {
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
      ],
    });

    await db.sync();

    const createdAResult = await db.getRepository('a').create({
      values: {
        name: 'a1',
        b: {
          name: 'b123',
          c: {
            name: 'c123',
          },
        },
      },
    });

    expect(createdAResult.get('b')).toBeFalsy();
    const bs = await db.getRepository('b').find({});
    expect(bs.some((b) => b.name === 'b123')).toBeFalsy();
    const cs = await db.getRepository('c').find({});
    expect(cs.some((c) => c.name === 'c123')).toBeFalsy();
  });

  it('should not modify existing record fields when association data contains both id and other fields', async () => {
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
      ],
    });

    await db.sync();

    const createdBResult = await db.getRepository('b').create({
      values: {
        name: 'b456',
      },
    });

    const createdCResult = await db.getRepository('c').create({
      values: {
        name: 'c456',
      },
    });

    const createdAResult = await db.getRepository('a').create({
      values: {
        name: 'a2',
        b: {
          id: createdBResult.id,
          name: 'b789',
          c: {
            id: createdCResult.id,
            name: 'c789',
          },
        },
      },
    });
    expect(createdAResult.get('b')[0].id).toBe(createdBResult.get('id'));

    const bResult = await db.getRepository('b').findOne({
      where: {
        id: createdBResult.id,
      },
    });
    expect(bResult.get('name')).toBe('b456');

    const cResult = await db.getRepository('c').findOne({
      where: {
        id: createdCResult.id,
      },
    });
    expect(cResult.get('name')).toBe('c456');
  });
});

describe('update associations with nested paths & permissions', () => {
  let db: Database;
  const getCalledResources = (fn: any) =>
    (fn?.mock?.calls || []).map((args: any[]) => args?.[0]?.resource).filter(Boolean);
  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('hasOne: should allow nested path b.c.d when can() permits and keep leaf only targetKey', async () => {
    db.collection({
      name: 'a',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasOne', name: 'b', target: 'b' },
      ],
    });
    db.collection({
      name: 'b',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasOne', name: 'c', target: 'c' },
      ],
    });
    db.collection({
      name: 'c',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasOne', name: 'd', target: 'd' },
      ],
    });
    db.collection({
      name: 'd',
      fields: [{ type: 'string', name: 'name' }],
    });

    await db.sync();

    const b = await db.getRepository('b').create({ values: { name: 'b-origin' } });
    const c = await db.getRepository('c').create({ values: { name: 'c-origin' } });
    const d = await db.getRepository('d').create({ values: { name: 'd-origin' } });

    const can = vi.fn(({ resource }) => {
      return resource === 'b' || resource === 'c' || resource === 'd';
    });

    const created = await db.getRepository('a').create({
      updateAssociationValues: ['b.c.d'],
      context: { can },
      values: {
        name: 'a1',
        b: {
          id: b.id,
          name: 'b-new',
          c: {
            id: c.id,
            name: 'c-new',
            d: {
              id: d.id,
              name: 'd-new',
            },
          },
        },
      },
    });

    // 确认三层关联已建立
    const d1 = await d.reload();
    expect(d1.cId).toBe(c.id);

    // 名称不被修改（即使请求里带了 name），以验证叶子层被过滤
    const [bAfter, cAfter, dAfter] = await Promise.all([b.reload(), c.reload(), d.reload()]);
    expect(bAfter.name).toBe('b-origin');
    expect(cAfter.name).toBe('c-origin');
    expect(dAfter.name).toBe('d-origin');

    // can 被验证到每一层
    expect(can).toHaveBeenCalled();
    const calledResources = getCalledResources(can);
    expect(calledResources).toEqual(expect.arrayContaining(['b', 'c', 'd']));

    expect(created).toBeTruthy();
  });

  it('hasOne: should throw when can() denies on middle path', async () => {
    db.collection({
      name: 'a',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasOne', name: 'b', target: 'b' },
      ],
    });
    db.collection({
      name: 'b',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasOne', name: 'c', target: 'c' },
      ],
    });
    db.collection({
      name: 'c',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasOne', name: 'd', target: 'd' },
      ],
    });
    db.collection({
      name: 'd',
      fields: [{ type: 'string', name: 'name' }],
    });
    await db.sync();

    const b = await db.getRepository('b').create({ values: {} });
    const c = await db.getRepository('c').create({ values: {} });
    const d = await db.getRepository('d').create({ values: {} });

    const can = vi.fn(({ resource }) => resource !== 'c'); // 拒绝 c 层

    await expect(
      db.getRepository('a').create({
        updateAssociationValues: ['b.c.d'],
        context: { can },
        values: {
          name: 'a1',
          b: {
            id: b.id,
            c: {
              id: c.id,
              d: { id: d.id },
            },
          },
        },
      }),
    ).rejects.toThrow('No permission to update association c');
  });

  it('hasMany: should allow nested path and filter array leaf to targetKey only', async () => {
    db.collection({
      name: 'a',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasMany', name: 'b', target: 'b' },
      ],
    });
    db.collection({
      name: 'b',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasMany', name: 'c', target: 'c' },
      ],
    });
    db.collection({
      name: 'c',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasMany', name: 'd', target: 'd' },
      ],
    });
    db.collection({
      name: 'd',
      fields: [{ type: 'string', name: 'name' }],
    });

    await db.sync();

    const b = await db.getRepository('b').create({ values: { name: 'b-origin' } });
    const c = await db.getRepository('c').create({ values: { name: 'c-origin' } });
    const d1 = await db.getRepository('d').create({ values: { name: 'd1-origin' } });
    const d2 = await db.getRepository('d').create({ values: { name: 'd2-origin' } });

    const can = vi.fn(() => true);

    await db.getRepository('a').create({
      updateAssociationValues: ['b.c.d'],
      context: { can },
      values: {
        name: 'a1',
        b: {
          id: b.id,
          c: {
            id: c.id,
            d: [
              { id: d1.id, name: 'x1' },
              { id: d2.id, name: 'x2' },
            ],
          },
        },
      },
    });

    const [rd1, rd2] = await Promise.all([d1.reload(), d2.reload()]);
    expect(rd1.cId).toBe(c.id);
    expect(rd2.cId).toBe(c.id);
    expect(rd1.name).toBe('d1-origin');
    expect(rd2.name).toBe('d2-origin');
  });

  it('complex nested: allow assoc1/assoc2 deep, assoc3/assoc4/assoc5 as link-only (assoc5 targetKey=key)', async () => {
    // root -> assoc1 (hasOne t1)
    // t1 -> assoc2 (hasOne t2), assoc5 (hasMany t5, targetKey=key)
    // t2 -> assoc3 (hasOne t3), assoc4 (hasMany t4)
    // t5 -> assoc6 (hasOne t6) 但本次仅关联到 t5，不触发 assoc6

    db.collection({
      name: 'root',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasOne', name: 'assoc1', target: 't1' },
      ],
    });

    db.collection({
      name: 't1',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasOne', name: 'assoc2', target: 't2' },
        {
          type: 'hasMany',
          name: 'assoc5',
          target: 't5',
          targetKey: 'key',
        },
      ],
    });

    db.collection({
      name: 't2',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasOne', name: 'assoc3', target: 't3' },
        { type: 'hasMany', name: 'assoc4', target: 't4' },
      ],
    });

    db.collection({
      name: 't3',
      fields: [{ type: 'string', name: 'content' }],
    });

    db.collection({
      name: 't4',
      fields: [{ type: 'string', name: 'title' }],
    });

    db.collection({
      name: 't5',
      filterTargetKey: 'key',
      fields: [
        { type: 'string', name: 'key', unique: true },
        { type: 'string', name: 'content' },
        { type: 'hasOne', name: 'assoc6', target: 't6' },
      ],
    });

    db.collection({
      name: 't6',
      fields: [{ type: 'string', name: 'name' }],
    });

    await db.sync();

    const t1 = await db.getRepository('t1').create({ values: { name: 't1-origin' } });
    const t2 = await db.getRepository('t2').create({ values: { name: 't2-origin' } });
    const t3 = await db.getRepository('t3').create({ values: { content: 't3-origin' } });
    const t4a = await db.getRepository('t4').create({ values: { title: 't4a-origin' } });
    const t4b = await db.getRepository('t4').create({ values: { title: 't4b-origin' } });
    const t5a = await db.getRepository('t5').create({ values: { key: 'uid1', content: 'old-1' } });
    const t5b = await db.getRepository('t5').create({ values: { key: 'uid2', content: 'old-2' } });
    const t6x = await db.getRepository('t6').create({ values: { name: 't6-x' } });
    const t6y = await db.getRepository('t6').create({ values: { name: 't6-y' } });

    const can = vi.fn(() => true);

    await db.getRepository('root').create({
      updateAssociationValues: [
        'assoc1',
        'assoc1.assoc2',
        'assoc1.assoc2.assoc3',
        'assoc1.assoc2.assoc4',
        'assoc1.assoc5',
      ],
      context: { can },
      values: {
        name: 'root-1',
        assoc1: {
          id: t1.id,
          name: 'a',
          assoc2: {
            id: t2.id,
            assoc3: {
              id: t3.id,
              content: 'should-not-change',
            },
            assoc4: [
              { id: t4a.id, title: 'should-not-change-1' },
              { id: t4b.id, title: 'should-not-change-2' },
            ],
          },
          assoc5: [
            { key: 'uid1', content: 'aa', assoc6: { id: t6x.id } },
            { key: 'uid2', content: 'aa', assoc6: { id: t6y.id } },
          ],
        },
      },
    });

    const rt3 = await db.getRepository('t3').findOne({ where: { id: t3.id } });
    expect(rt3.get('t2Id')).toBe(t2.id);
    expect(rt3.get('content')).toBe('t3-origin');

    const [rt4a, rt4b] = await Promise.all([
      db.getRepository('t4').findOne({ where: { id: t4a.id } }),
      db.getRepository('t4').findOne({ where: { id: t4b.id } }),
    ]);
    expect(rt4a.get('t2Id')).toBe(t2.id);
    expect(rt4b.get('t2Id')).toBe(t2.id);
    expect(rt4a.get('title')).toBe('t4a-origin');
    expect(rt4b.get('title')).toBe('t4b-origin');

    const [rt5a, rt5b] = await Promise.all([
      db.getRepository('t5').findOne({ where: { key: 'uid1' } }),
      db.getRepository('t5').findOne({ where: { key: 'uid2' } }),
    ]);
    expect(rt5a.get('t1Id')).toBe(t1.id);
    expect(rt5b.get('t1Id')).toBe(t1.id);
    expect(rt5a.get('content')).toBe('old-1');
    expect(rt5b.get('content')).toBe('old-2');
    expect(rt5a.get('t6Id')).toBeFalsy();
    expect(rt5b.get('t6Id')).toBeFalsy();

    const calledResources = getCalledResources(can);
    expect(calledResources).toEqual(expect.arrayContaining(['t1', 't2', 't3', 't4', 't5']));
  });

  it('tree children: should not filter children and allow creating child nodes without updateAssociationValues', async () => {
    db.collection({
      name: 'nodes',
      tree: 'adjacencyList',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'belongsTo', name: 'parent', target: 'nodes', foreignKey: 'parentId', treeParent: true },
        { type: 'hasMany', name: 'children', target: 'nodes', foreignKey: 'parentId', treeChildren: true },
      ],
    });

    await db.sync();

    const root = await db.getRepository('nodes').create({
      values: {
        name: 'root',
        children: [{ name: 'c1' }, { name: 'c2' }],
      },
    });

    const children = await db.getRepository('nodes').find({
      filter: { parentId: root.get('id') },
      sort: ['id'],
    });

    expect(children.length).toBe(2);
    expect(children[0].get('name')).toBe('c1');
    expect(children[1].get('name')).toBe('c2');
  });
});
