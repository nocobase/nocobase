import Database from '../database';
import { mockDatabase } from '../mock-database';

describe('changedWithAssociations', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should get change afterCreate', async () => {
    db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'belongsToMany', name: 'tags' },
      ],
    });

    db.collection({
      name: 'tags',
      fields: [{ type: 'string', name: 'name' }],
    });

    await db.sync();

    let createChanged = [];

    db.on('users.afterCreate', (model, options) => {
      createChanged = model.changed();
    });

    const t1 = await db.getRepository('tags').create({
      values: {
        name: 't1',
      },
    });

    const t2 = await db.getRepository('tags').create({
      values: {
        name: 't2',
      },
    });

    const r = db.getRepository('users');
    const m = await r.create({ values: { name: 'u1', tags: [{ id: t1.get('id') }] } });

    expect(createChanged).toEqual(['name', 'tags']);
  });

  test('changedWithAssociations', async () => {
    db.collection({
      name: 'test',
      fields: [
        {
          type: 'string',
          name: 'n1',
        },
        {
          type: 'string',
          name: 'n2',
        },
      ],
    });
    let changed = [];
    db.on('test.afterCreateWithAssociations', (model, options) => {
      changed = model.changedWithAssociations();
    });
    db.on('test.afterUpdateWithAssociations', (model, options) => {
      changed = model.changedWithAssociations();
    });
    await db.sync();
    const r = db.getRepository('test');
    const m = await r.create({ values: { n1: 'a' } });
    expect(changed.includes('n1')).toBeTruthy();
    expect(m.changedWithAssociations()).toBeFalsy();
    await r.update({ filterByTk: m.id, values: { n1: 'b', n2: 'c' } });
    expect(changed).toEqual(['n1', 'n2']);
    expect(m.changedWithAssociations()).toBeFalsy();
  });
});
