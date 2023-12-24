import { vi } from 'vitest';
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

    db.collectionFactory.registerCollectionType(ChildCollection, {
      condition: (options) => options.child,
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

  it('should register collection type with sync logic', async () => {
    class ChildCollection extends Collection {
      static type = 'child';
    }

    const fn = vi.fn();

    db.collectionFactory.registerCollectionType(ChildCollection, {
      condition: (options) => options.child,
      onSync(model, options) {
        fn();
      },
    });

    const collection = db.collectionFactory.createCollection({
      name: 'child',
      child: true,
    });

    await collection.sync();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
