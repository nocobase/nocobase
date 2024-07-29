/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer, waitSecond } from '@nocobase/test';
import { CollectionManager, DataSource } from '@nocobase/data-source-manager';
import { HasManyRepository } from '@nocobase/database';

describe('data source collection', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['nocobase', 'data-source-manager'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should update collection fields', async () => {
    class MockDataSource extends DataSource {
      static testConnection(options?: any): Promise<boolean> {
        return Promise.resolve(true);
      }

      async load(): Promise<void> {
        await waitSecond(1000);
      }

      createCollectionManager(options?: any): any {
        return new CollectionManager(options);
      }
    }

    app.dataSourceManager.factory.register('mock', MockDataSource);

    await app.db.getRepository('dataSources').create({
      values: {
        key: 'mockInstance1',
        type: 'mock',
        displayName: 'Mock',
        options: {},
      },
    });

    await waitSecond(2000);

    const dataSource = app.dataSourceManager.get('mockInstance1');
    const collectionInDb = await app.db.getRepository('dataSourcesCollections').create({
      values: {
        name: 'test',
        title: 'Test',
        dataSourceKey: 'mockInstance1',
        fields: [
          {
            name: 'name',
            type: 'string',
          },
          {
            name: 'age',
            type: 'integer',
          },
        ],
      },
      updateAssociationValues: ['fields'],
    });

    // should get collection from collection manager
    const collectionManager = dataSource.collectionManager;
    const collection = collectionManager.getCollection('test');
    expect(collection).toBeTruthy();
    expect(collection.getField('name')).toBeTruthy();
    expect(collection.getField('age')).toBeTruthy();

    const collectionInJson = collectionInDb.toJSON();

    // set name field ui schema
    collectionInJson.fields.forEach((field: any) => {
      if (field.name === 'name') {
        field.uiSchema = {
          title: 'Name',
          'x-component': 'Input',
        };
      }
    });

    // push a new fields
    collectionInJson.fields.push({
      name: 'email',
      type: 'string',
    });

    // update collection with fields
    await app.db.getRepository<HasManyRepository>('dataSources.collections', 'mockInstance1').update({
      filterByTk: 'test',
      values: collectionInJson,
      updateAssociationValues: ['fields'],
    });

    // get collection from collection manager again
    const collection2 = collectionManager.getCollection('test');
    expect(collection2).toBeTruthy();

    expect(collection2.getField('name')).toBeTruthy();
    expect(collection2.getField('age')).toBeTruthy();
    expect(collection2.getField('email')).toBeTruthy();

    expect(collection2.getField('name').options.uiSchema).toEqual({
      title: 'Name',
      'x-component': 'Input',
    });

    const collectionInDb2 = await app.db.getRepository('dataSourcesCollections').findOne({
      filter: {
        name: 'test',
      },
      appends: ['fields'],
    });

    const collectionInJson2 = collectionInDb2.toJSON();
    // it should remove field in update
    collectionInJson2.fields = collectionInJson2.fields.filter((field: any) => field.name !== 'age');

    await app.db.getRepository<HasManyRepository>('dataSources.collections', 'mockInstance1').update({
      filterByTk: 'test',
      values: collectionInJson2,
      updateAssociationValues: ['fields'],
    });

    const collection3 = collectionManager.getCollection('test');
    expect(collection3).toBeTruthy();
    expect(collection3.getField('name')).toBeTruthy();
    expect(collection3.getField('age')).toBeFalsy();
  });
});
