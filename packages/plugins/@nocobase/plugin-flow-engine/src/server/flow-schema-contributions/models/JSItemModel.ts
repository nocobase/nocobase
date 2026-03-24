/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution } from '@nocobase/flow-engine';
import { runJsActionSettingsStepParamsSchema } from '../shared';

const jsItemRecommendedFallback = {
  version: 'v2',
  code: "ctx.render('<div>Hello JS item.</div>');",
};

export const jsItemModelInternalSchemaContribution: FlowModelSchemaContribution = {
  use: 'JSItemModel',
  title: 'JS item',
  source: 'official',
  strict: false,
  exposure: 'internal',
  suggestedUses: ['CreateFormModel', 'EditFormModel'],
  stepParamsSchema: {
    type: 'object',
    properties: {
      jsSettings: runJsActionSettingsStepParamsSchema,
    },
    additionalProperties: true,
  },
  skeleton: {
    uid: 'todo-js-item-uid',
    use: 'JSItemModel',
    stepParams: {
      jsSettings: {
        runJs: jsItemRecommendedFallback,
      },
    },
  },
  docs: {
    minimalExample: {
      uid: 'js-item-hello',
      use: 'JSItemModel',
      stepParams: {
        jsSettings: {
          runJs: jsItemRecommendedFallback,
        },
      },
    },
    dynamicHints: [
      {
        kind: 'dynamic-ui-schema',
        path: 'JSItemModel.stepParams.jsSettings.runJs',
        message: 'JS item code runs inside the runtime form context and renders custom content inside the form grid.',
        'x-flow': {
          contextRequirements: ['form context', 'runjs runtime'],
          unresolvedReason: 'runtime-js-item-context',
          recommendedFallback: jsItemRecommendedFallback,
        },
      },
    ],
  },
};
