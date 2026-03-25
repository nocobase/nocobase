/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution } from '@nocobase/flow-engine';
import { createActionStepParamsSchema, linkActionSettingsStepParamsSchema } from '../shared';

export const linkActionModelInternalSchemaContribution: FlowModelSchemaContribution = {
  use: 'LinkActionModel',
  title: 'Link action',
  source: 'official',
  strict: false,
  exposure: 'internal',
  suggestedUses: ['TableBlockModel', 'TableActionsColumnModel', 'DetailsBlockModel'],
  stepParamsSchema: createActionStepParamsSchema({
    actionPanelLinkSettings: linkActionSettingsStepParamsSchema,
  }),
};
