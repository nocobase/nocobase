/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaManifest } from '@nocobase/flow-engine';
import { createActionStepParamsSchema, popupActionSettingsStepParamsSchema } from '../shared';

export const viewActionModelInternalSchemaManifest: FlowModelSchemaManifest = {
  use: 'ViewActionModel',
  title: 'View action',
  source: 'official',
  strict: true,
  exposure: 'internal',
  allowDirectUse: false,
  suggestedUses: ['TableActionsColumnModel', 'DetailsBlockModel'],
  stepParamsSchema: createActionStepParamsSchema({
    popupSettings: popupActionSettingsStepParamsSchema,
  }),
};
