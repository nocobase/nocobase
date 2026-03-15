/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaManifest } from '@nocobase/flow-engine';
import {
  createFormBlockCommonPatterns,
  createFormBlockDynamicHints,
  createFormBlockMinimalExample,
  createFormBlockSkeleton,
  createFormBlockSubModelSlots,
  formBlockAntiPatterns,
  formBlockBaseStepParamsSchema,
} from '../shared';

export const createFormModelSchemaManifest: FlowModelSchemaManifest = {
  use: 'CreateFormModel',
  title: 'Form (Add new)',
  source: 'official',
  strict: false,
  stepParamsSchema: formBlockBaseStepParamsSchema,
  subModelSlots: createFormBlockSubModelSlots(),
  skeleton: createFormBlockSkeleton('CreateFormModel'),
  docs: {
    minimalExample: createFormBlockMinimalExample('CreateFormModel'),
    commonPatterns: createFormBlockCommonPatterns('CreateFormModel'),
    antiPatterns: formBlockAntiPatterns,
    dynamicHints: createFormBlockDynamicHints('CreateFormModel'),
  },
};
