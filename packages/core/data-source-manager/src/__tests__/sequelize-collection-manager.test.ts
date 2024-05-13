/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SequelizeCollectionManager } from '@nocobase/data-source-manager';

describe('sequelize collection manager', () => {
  it('should define collection', async () => {
    const collectionManager = new SequelizeCollectionManager({
      dialect: 'sqlite',
      database: ':memory:',
    });

    collectionManager.defineCollection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
      ],
    });

    const UsersCollection = collectionManager.getCollection('users');
    expect(UsersCollection).toBeTruthy();

    expect(collectionManager.hasCollection('users')).toBeTruthy();
  });

  it('should set collection filter', async () => {
    const collectionManager = new SequelizeCollectionManager({
      dialect: 'sqlite',
      database: ':memory:',
      collectionsFilter: (collection) => {
        return ['posts', 'comments'].includes(collection.name);
      },
    });

    collectionManager.defineCollection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
      ],
    });

    collectionManager.defineCollection({
      name: 'posts',
      fields: [
        {
          type: 'string',
          name: 'title',
        },
      ],
    });

    collectionManager.defineCollection({
      name: 'comments',
      fields: [
        {
          type: 'string',
          name: 'content',
        },
      ],
    });

    const collections = collectionManager.getCollections();
    expect(collections.length).toBe(2);
    expect(collections.map((collection) => collection.name)).toEqual(['posts', 'comments']);
  });
});
