/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from 'vitest';
import { applyPostProcessor } from '../lib/post-processors.js';
import { registerDataSourceManagerPostProcessors } from '../post-processors/data-source-manager.js';

registerDataSourceManagerPostProcessors();

test('external data source fields apply returns relation summary', async () => {
  const result = await applyPostProcessor(
    {
      data: {
        data: {
          name: 'post',
          type: 'belongsTo',
          interface: 'm2o',
          target: 'posts',
          foreignKey: 'postId',
          sourceKey: 'id',
          targetKey: 'id',
          uiSchema: {
            title: 'Post',
          },
        },
      },
    },
    {
      flags: {
        'associated-index': 'external.comments',
      },
      operation: {
        moduleName: 'data-modeling',
        commandId: 'data-modeling data-sources-collections fields apply',
        logicalResourceName: 'data-sources-collections.fields',
        actionName: 'apply',
        method: 'post',
        pathTemplate: '/dataSourcesCollections/{associatedIndex}/fields:apply',
        parameters: [],
        examples: [],
      },
    },
  );

  expect(result).toEqual({
    data: {
      name: 'post',
      type: 'belongsTo',
      interface: 'm2o',
      title: 'Post',
      description: undefined,
      dataSourceKey: 'external',
      collectionName: 'comments',
      target: 'posts',
      foreignKey: 'postId',
      sourceKey: 'id',
      targetKey: 'id',
      through: undefined,
      otherKey: undefined,
    },
  });
});
