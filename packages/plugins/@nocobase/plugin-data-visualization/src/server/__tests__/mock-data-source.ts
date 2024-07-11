/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionManager, DataSource, ICollectionManager, IModel, IRepository } from '@nocobase/data-source-manager';

class MockRepository implements IRepository {
  count(options?: any): Promise<Number> {
    return Promise.resolve(0);
  }

  findAndCount(options?: any): Promise<[IModel[], Number]> {
    return Promise.resolve([[], 0]);
  }

  async find() {
    return [];
  }

  async findOne() {
    return {} as any;
  }

  async create() {}

  async update() {}

  async destroy() {}
}

class MockCollectionManager extends CollectionManager {
  getRepository(name: string, sourceId?: string | number): IRepository {
    return new MockRepository();
  }
}

export class MockDataSource extends DataSource {
  async load(): Promise<void> {
    this.collectionManager.defineCollection({
      name: 'posts',
      fields: [
        {
          type: 'string',
          name: 'title',
        },
        {
          type: 'hasMany',
          name: 'comments',
        },
      ],
    });

    this.collectionManager.defineCollection({
      name: 'comments',
      fields: [
        {
          type: 'string',
          name: 'content',
        },
      ],
    });
  }

  createCollectionManager(options?: any): ICollectionManager {
    return new MockCollectionManager();
  }
}
