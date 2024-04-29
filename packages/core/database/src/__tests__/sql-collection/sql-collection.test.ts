import { mockDatabase } from '../../mock-database';
import { SqlCollection } from '../../sql-collection';

test('sql-collection', async () => {
  const db = mockDatabase({ tablePrefix: '' });
  await db.clean({ drop: true });
  const collection = db.collectionFactory.createCollection<SqlCollection>({
    name: 'test',
    sql: true,
  });
  expect(collection.isSql()).toBe(true);
  expect(collection.collectionSchema()).toBeUndefined();
  expect(collection.options.autoGenId).toBe(false);
  expect(collection.options.timestamps).toBe(false);
  expect(collection.options.underscored).toBe(false);

  collection.modelInit();
  // @ts-ignore
  expect(collection.model._schema).toBeUndefined();
});
