import Database from '../database';
import { mockDatabase } from './index';
import { Collection } from '../collection';

describe('collection factory', function () {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();

    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should register new collection type', async () => {
    class ChildCollection extends Collection {
      static type = 'child';
    }

    db.collectionFactory.registerCollectionType(ChildCollection, (options) => {
      return options.child == true;
    });

    const collection = db.collectionFactory.createCollection({
      name: 'child',
      child: true,
    });

    expect(collection).toBeInstanceOf(ChildCollection);

    const collection2 = db.collectionFactory.createCollection({
      name: 'collection',
    });

    expect(collection2).toBeInstanceOf(Collection);
  });
});
