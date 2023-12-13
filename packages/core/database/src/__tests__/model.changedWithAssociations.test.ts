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
