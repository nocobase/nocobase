import { Database } from '../database';
import { mockDatabase } from './';

describe('update associations', () => {
  let db: Database;
  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
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
