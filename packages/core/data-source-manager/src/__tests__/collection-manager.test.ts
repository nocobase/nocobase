/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionManager } from '@nocobase/data-source-manager';
import { Repository } from '../repository';

describe('Collection Manager', () => {
  it('should define collection', async () => {
    const collectionManager = new CollectionManager();

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

  it('should extend collection', async () => {
    const collectionManager = new CollectionManager();

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

    collectionManager.extendCollection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'age',
        },
      ],
    });

    expect(UsersCollection.getField('age')).toBeTruthy();
  });

  it('should register repository', async () => {
    class MockRepository extends Repository {
      async find() {
        return [];
      }
    }

    const collectionManager = new CollectionManager();
    collectionManager.registerRepositories({
      MockRepository: MockRepository,
    });

    collectionManager.defineCollection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
      ],
      repository: 'MockRepository',
    });

    const UsersCollection = collectionManager.getCollection('users');

    expect(UsersCollection.repository).toBeInstanceOf(MockRepository);
  });
});
