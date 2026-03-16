/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaManifest } from '@nocobase/flow-engine';
import { createActionStepParamsSchema, runJsActionSettingsStepParamsSchema } from '../shared';

export const jsActionModelInternalSchemaManifest: FlowModelSchemaManifest = {
  use: 'JSActionModel',
  title: 'JS action',
  source: 'official',
  strict: true,
  exposure: 'internal',
  suggestedUses: ['ActionPanelBlockModel'],
  stepParamsSchema: createActionStepParamsSchema({
    clickSettings: runJsActionSettingsStepParamsSchema,
  }),
  skeleton: {
    uid: 'todo-js-action-uid',
    use: 'JSActionModel',
    stepParams: {
      buttonSettings: {
        general: {
          title: 'Run JS',
          type: 'default',
        },
      },
      clickSettings: {
        runJs: {
          version: 'v2',
          code: "ctx.message.info('Hello JS action.');",
        },
      },
    },
  },
};
