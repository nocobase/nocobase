import { mockDatabase } from './index';

describe('collection sortable options', () => {
  test('sortable=true', async () => {
    const db = mockDatabase();

    const Test = db.collection({
      name: 'test',
      sortable: true,
    });

    const model = Test.model;

    await db.sync();
    const instance = await model.create();
    expect(model.rawAttributes['sort']).toBeDefined();
    expect(instance.get('sort')).toBe(1);
  });

  test('sortable=string', async () => {
    const db = mockDatabase();

    const Test = db.collection({
      name: 'test',
      sortable: 'order',
    });

    const model = Test.model;

    await db.sync();
    const instance = await model.create();
    expect(model.rawAttributes['order']).toBeDefined();
    expect(instance.get('order')).toBe(1);
  });

  test('sortable=object', async () => {
    const db = mockDatabase();

    const Test = db.collection({
      name: 'test',
      sortable: {
        name: 'sort',
        scopeKey: 'status',
      },
      fields: [{ type: 'string', name: 'status' }],
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
  });
});
