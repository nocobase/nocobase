/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { getCollectionFieldOptions } from '../../../../plugin-workflow/src/client-v2/canvas/collectionFieldOptions';
import { getCollectionManagerAdapter } from '../../../../plugin-workflow/src/client-v2/components/collection/utils';
import { isRequestFileVariableMatch } from '../constants';

const compile = (value: unknown) => value;

function createDataSourceManager() {
  const collections = {
    posts: {
      template: undefined,
      fields: [
        { name: 'id', type: 'bigInt', interface: 'integer', uiSchema: { title: 'ID' }, primaryKey: true },
        {
          name: 'attachment',
          type: 'belongsTo',
          interface: 'm2o',
          target: 'files',
          targetKey: 'id',
          foreignKey: 'attachmentId',
          uiSchema: { title: 'Attachment' },
        },
        {
          name: 'attachmentId',
          type: 'bigInt',
          interface: 'integer',
          isForeignKey: true,
          foreignKey: 'attachmentId',
          uiSchema: { title: 'Attachment ID' },
        },
      ],
    },
    files: {
      template: 'file',
      fields: [{ name: 'id', type: 'bigInt', interface: 'integer', uiSchema: { title: 'ID' }, primaryKey: true }],
    },
  };

  return {
    getDataSource(dataSourceKey: string) {
      if (dataSourceKey !== 'main') {
        return undefined;
      }

      return {
        collectionManager: {
          getCollection(collectionName: string) {
            const collection = collections[collectionName as keyof typeof collections];
            if (!collection) {
              return undefined;
            }

            return {
              template: collection.template,
              getFields() {
                return collection.fields.map((options) => ({ options }));
              },
            };
          },
        },
      };
    },
  };
}

describe('plugin-workflow-request client-v2 constants', () => {
  it('supports file variable matching with the v2 collection manager adapter', () => {
    const collectionManager = getCollectionManagerAdapter(createDataSourceManager());

    expect(() =>
      getCollectionFieldOptions({
        collection: 'posts',
        appends: ['attachment'],
        types: [isRequestFileVariableMatch],
        compile,
        collectionManager,
      }),
    ).not.toThrow();

    const result = getCollectionFieldOptions({
      collection: 'posts',
      appends: ['attachment'],
      types: [isRequestFileVariableMatch],
      compile,
      collectionManager,
    });

    expect(result.some((option) => option.value === 'attachment')).toBe(true);
  });
});
