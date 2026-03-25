/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution } from '@nocobase/flow-engine';
import {
  createCurrentRecordCollectionPattern,
  createFormBlockCommonPatterns,
  createFormBlockDynamicHints,
  createFormBlockMinimalExample,
  createFormBlockSkeleton,
  createFormBlockSubModelSlots,
  dataScopeParamsSchema,
  formBlockAntiPatterns,
  formBlockBaseStepParamsSchema,
} from '../shared';

const editFormSkeleton = createFormBlockSkeleton('EditFormModel');
const editFormMinimalExample = createFormBlockMinimalExample('EditFormModel');

export const editFormModelSchemaContribution: FlowModelSchemaContribution = {
  use: 'EditFormModel',
  title: 'Form (Edit)',
  source: 'official',
  strict: false,
  stepParamsSchema: {
    ...formBlockBaseStepParamsSchema,
    properties: {
      ...(formBlockBaseStepParamsSchema.properties || {}),
      formSettings: {
        type: 'object',
        properties: {
          dataScope: dataScopeParamsSchema,
        },
        additionalProperties: true,
      },
    },
  },
  subModelSlots: createFormBlockSubModelSlots(),
  skeleton: {
    ...editFormSkeleton,
    stepParams: {
      ...editFormSkeleton.stepParams,
      formSettings: {
        dataScope: {
          filter: {
            logic: '$and',
            items: [],
          },
        },
      },
    },
  },
  docs: {
    minimalExample: {
      ...editFormMinimalExample,
      stepParams: {
        ...editFormMinimalExample.stepParams,
        formSettings: {
          dataScope: {
            filter: {
              logic: '$and',
              items: [],
            },
          },
        },
      },
    },
    commonPatterns: [
      ...createFormBlockCommonPatterns('EditFormModel'),
      createCurrentRecordCollectionPattern('EditFormModel', {
        formSettings: {
          dataScope: {
            filter: {
              logic: '$and',
              items: [],
            },
          },
        },
      }),
    ],
    antiPatterns: formBlockAntiPatterns,
    dynamicHints: createFormBlockDynamicHints('EditFormModel'),
  },
};
