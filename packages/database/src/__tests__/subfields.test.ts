import { getDatabase } from '.';
import Database from '..';

let db: Database;

beforeEach(() => {
  db = getDatabase();
});

afterEach(async () => {
  await db.sync();
  await db.close();
});

describe('sub fields', () => {
  it('hasOne', async () => {
    db.table({
      name: 't1ests',
      fields: [
        {
          type: 'hasOne',
          name: 'u1ser',
          fields: [
            {
              type: 'string',
              name: 'name',
            },
          ],
        },
      ],
    });
    expect(db.isDefined('t1ests')).toBeTruthy();
    expect(db.isDefined('u1sers')).toBeTruthy();
    expect([...db.getTable('t1ests').getFields().keys()]).toEqual(['u1ser']);
    expect([...db.getTable('u1sers').getFields().keys()]).toEqual(['name']);
  });

  it('hasMany', async () => {
    db.table({
      name: 't2ests',
      fields: [
        {
          type: 'hasMany',
          name: 'u2sers',
          fields: [
            {
              type: 'string',
              name: 'name',
            },
          ],
        },
      ],
    });
    expect(db.isDefined('t2ests')).toBeTruthy();
    expect(db.isDefined('u2sers')).toBeTruthy();
    expect([...db.getTable('t2ests').getFields().keys()]).toEqual(['u2sers']);
    expect([...db.getTable('u2sers').getFields().keys()]).toEqual(['name']);
  });

  it('belongsTo', async () => {
    db.table({
      name: 't3ests',
      fields: [
        {
          type: 'belongsTo',
          name: 'u3ser',
          fields: [
            {
              type: 'string',
              name: 'name',
            },
          ],
        },
      ],
    });
    expect(db.isDefined('t3ests')).toBeTruthy();
    expect(db.isDefined('u3sers')).toBeTruthy();
    expect([...db.getTable('t3ests').getFields().keys()]).toEqual(['u3ser']);
    expect([...db.getTable('u3sers').getFields().keys()]).toEqual(['name']);
  });

  it('belongsToMany', async () => {
    db.table({
      name: 't4ests',
      fields: [
        {
          type: 'belongsToMany',
          name: 'u4sers',
          fields: [
            {
              type: 'string',
              name: 'name',
            },
          ],
        },
      ],
    });
    expect(db.isDefined('t4ests')).toBeTruthy();
    expect(db.isDefined('u4sers')).toBeTruthy();
    expect([...db.getTable('t4ests').getFields().keys()]).toEqual(['u4sers']);
    expect([...db.getTable('u4sers').getFields().keys()]).toEqual(['name']);
  });
});
