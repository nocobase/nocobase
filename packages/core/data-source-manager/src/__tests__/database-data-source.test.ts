/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DatabaseDataSource } from '@nocobase/data-source-manager';

describe('database data source', () => {
  it('should preserve mapped fields regardless of loaded field order', () => {
    const dataSource = Object.create(DatabaseDataSource.prototype) as DatabaseDataSource<any>;

    const [mergedCollection] = dataSource.mergeWithLoadedCollections(
      [
        {
          name: 'files',
          fields: [
            { name: 'url', type: 'text', interface: 'url' },
            { name: 'title', type: 'string', interface: 'input' },
          ],
        },
      ] as any,
      {
        files: {
          name: 'files',
          fields: [
            { name: 'preview', type: 'text', interface: 'url', field: 'url' },
            { name: 'title', type: 'string', interface: 'input' },
            { name: 'url', type: 'text', interface: 'url' },
          ],
        },
      } as any,
    );

    expect(mergedCollection.fields.map((field) => field.name)).toEqual(['url', 'title', 'preview']);
    expect(mergedCollection.fields.find((field) => field.name === 'preview')).toMatchObject({
      name: 'preview',
      field: 'url',
      interface: 'url',
    });
  });

  it('should not preserve same-name physical mappings as logical alias fields', () => {
    const dataSource = Object.create(DatabaseDataSource.prototype) as DatabaseDataSource<any>;

    const [mergedCollection] = dataSource.mergeWithLoadedCollections(
      [
        {
          name: 'events',
          fields: [{ name: 'createdAt', type: 'date', interface: 'datetime' }],
        },
      ] as any,
      {
        events: {
          name: 'events',
          fields: [{ name: 'created_at', type: 'datetimeTz', interface: 'datetime', field: 'created_at' }],
        },
      } as any,
    );

    expect(mergedCollection.fields.map((field) => field.name)).toEqual(['createdAt']);
  });

  it('should preserve loaded metadata when incoming field matches by physical column', () => {
    const dataSource = Object.create(DatabaseDataSource.prototype) as DatabaseDataSource<any>;

    const [mergedCollection] = dataSource.mergeWithLoadedCollections(
      [
        {
          name: 'events',
          fields: [
            {
              name: 'created_at',
              type: 'date',
              interface: 'datetime',
              uiSchema: {
                title: 'created_at',
              },
            },
          ],
        },
      ] as any,
      {
        events: {
          name: 'events',
          fields: [
            {
              name: 'createdAt',
              type: 'datetimeTz',
              interface: 'datetime',
              field: 'created_at',
              uiSchema: {
                title: 'Created time',
              },
            },
          ],
        },
      } as any,
    );

    expect(mergedCollection.fields).toHaveLength(1);
    expect(mergedCollection.fields[0]).toMatchObject({
      name: 'createdAt',
      field: 'created_at',
      type: 'datetimeTz',
      interface: 'datetime',
      uiSchema: {
        title: 'Created time',
      },
    });
  });
});
