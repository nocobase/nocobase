/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelSchemaContribution } from '../../flow-schema-registry';
import { runJsActionSettingsStepParamsSchema } from '../shared';

export const jsBlockModelSchemaContribution: FlowModelSchemaContribution = {
  use: 'JSBlockModel',
  title: 'JS block',
  source: 'official',
  strict: false,
  stepParamsSchema: {
    type: 'object',
    properties: {
      jsSettings: runJsActionSettingsStepParamsSchema,
    },
    additionalProperties: true,
  },
  skeleton: {
    uid: 'todo-js-block-uid',
    use: 'JSBlockModel',
    stepParams: {
      jsSettings: {
        runJs: {
          version: 'v2',
          code: "ctx.render('<div>Hello JS block.</div>');",
        },
      },
    },
  },
  docs: {
    minimalExample: {
      uid: 'js-block-hello',
      use: 'JSBlockModel',
      stepParams: {
        jsSettings: {
          runJs: {
            version: 'v2',
            code: "ctx.render('<div>Hello JS block.</div>');",
          },
        },
      },
    },
    dynamicHints: [
      {
        kind: 'dynamic-ui-schema',
        path: 'JSBlockModel.stepParams.jsSettings.runJs',
        message: 'JS block code runs in the runtime JS sandbox and can use the flow block render context.',
        'x-flow': {
          contextRequirements: ['runjs sandbox', 'block render context'],
          unresolvedReason: 'runtime-js-block-context',
          recommendedFallback: {
            version: 'v2',
            code: "ctx.render('<div>Hello JS block.</div>');",
          },
        },
      },
    ],
  },
};
