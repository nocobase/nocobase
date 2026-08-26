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
import { registerDataModelingPostProcessors } from '../post-processors/data-modeling.js';

registerDataModelingPostProcessors();

test('collections apply unwraps action response and returns collection fields', async () => {
  const result = await applyPostProcessor(
    {
      data: {
        data: {
          key: 'collection-key',
          name: 'contracts',
          title: 'Contracts',
          template: 'general',
          filterTargetKey: 'id',
          titleField: 'id',
          fields: [
            {
              key: 'field-key',
              name: 'contractNo',
              type: 'sequence',
              collectionName: 'contracts',
              uiSchema: {
                title: 'Contract No.',
              },
            },
          ],
        },
        verify: {
          valid: true,
          issues: [],
        },
      },
    },
    {
      flags: {},
      operation: {
        moduleName: 'data-modeling',
        commandId: 'data-modeling collections apply',
        logicalResourceName: 'collections',
        actionName: 'apply',
        method: 'post',
        pathTemplate: '/collections:apply',
        parameters: [],
        examples: [],
      },
    },
  );

  expect(result).toEqual({
    data: {
      key: 'collection-key',
      name: 'contracts',
      title: 'Contracts',
      template: 'general',
      description: undefined,
      filterTargetKey: 'id',
      titleField: 'id',
      fields: [
        {
          key: 'field-key',
          name: 'contractNo',
          type: 'sequence',
          title: 'Contract No.',
          description: undefined,
          collectionName: 'contracts',
        },
      ],
    },
    verify: {
      valid: true,
      issues: [],
    },
  });
});

test('fields apply unwraps action response and returns field summary', async () => {
  const result = await applyPostProcessor(
    {
      data: {
        data: {
          key: 'field-key',
          name: 'contractNo',
          type: 'sequence',
          collectionName: 'contracts',
          uiSchema: {
            title: 'Contract No.',
          },
        },
      },
    },
    {
      flags: {},
      operation: {
        moduleName: 'data-modeling',
        commandId: 'data-modeling fields apply',
        logicalResourceName: 'fields',
        actionName: 'apply',
        method: 'post',
        pathTemplate: '/collections/{collectionName}/fields:apply',
        parameters: [],
        examples: [],
      },
    },
  );

  expect(result).toEqual({
    data: {
      key: 'field-key',
      name: 'contractNo',
      type: 'sequence',
      title: 'Contract No.',
      description: undefined,
      collectionName: 'contracts',
    },
  });
});
