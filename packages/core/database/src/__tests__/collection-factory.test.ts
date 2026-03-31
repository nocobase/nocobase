/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, Database, createMockDatabase } from '@nocobase/database';
import { vi } from 'vitest';

describe('collection factory', function () {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();

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
