import { Database } from '../../database';
import { mockDatabase } from '../';

describe('string field', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
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
});
