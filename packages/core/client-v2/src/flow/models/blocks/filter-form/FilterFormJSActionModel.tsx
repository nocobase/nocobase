/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr, type StepDefinition } from '@nocobase/flow-engine';
import { FilterFormActionModel } from './FilterFormActionModel';
import { resolveRunJsParams } from '../../utils/resolveRunJsParams';
import {
  createJSActionEmbeddedEditorUIMode,
  createJSActionRunJsUISchema,
  createJSActionSourceBindingStep,
  createJSActionSourceModeStep,
  getJSActionRuntimeFlowSettingSteps,
  INLINE_SOURCE_MODE,
  runJSActionRuntime,
} from '../../actions/jsActionLightExtensionRuntime';

export class FilterFormJSActionModel extends FilterFormActionModel {
  public async getRuntimeFlowSettingSteps(flowKey: string): Promise<Record<string, StepDefinition> | undefined> {
    if (flowKey !== 'clickSettings') {
      return undefined;
    }

    return getJSActionRuntimeFlowSettingSteps(this);
  }
}

FilterFormJSActionModel.define({
  label: tExpr('JS action'),
  sort: 9999,
});

FilterFormJSActionModel.registerFlow({
  key: 'clickSettings',
  on: 'click',
  title: tExpr('Click settings'),
  steps: {
    sourceMode: createJSActionSourceModeStep(),
    sourceBinding: createJSActionSourceBindingStep(),
    runJs: {
      title: tExpr('Write JavaScript'),
      useRawParams: true,
      uiSchema: createJSActionRunJsUISchema({ minHeight: '400px' }),
      uiMode: createJSActionEmbeddedEditorUIMode,
      defaultParams(ctx) {
        return {
          version: 'v2',
          sourceMode: INLINE_SOURCE_MODE,
          code: '',
        };
      },
      async handler(ctx, params) {
        await runJSActionRuntime({
          ctx,
          params: params || {},
          runJs: resolveRunJsParams(ctx, params),
        });
      },
    },
  },
});
