/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution } from '@nocobase/flow-engine';
import { createActionStepParamsSchema, deleteActionSettingsStepParamsSchema } from '../shared';

export const bulkDeleteActionModelInternalSchemaContribution: FlowModelSchemaContribution = {
  use: 'BulkDeleteActionModel',
  title: 'Bulk delete action',
  source: 'official',
  strict: false,
  exposure: 'internal',
  suggestedUses: ['TableBlockModel'],
  stepParamsSchema: createActionStepParamsSchema({
    deleteSettings: deleteActionSettingsStepParamsSchema,
  }),
};
