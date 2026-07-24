/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * JS Form Action：表单工具栏按钮点击执行 JS。
 */
import { tExpr, type StepDefinition } from '@nocobase/flow-engine';
import { FormActionModel } from './FormActionModel';
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

export class JSFormActionModel extends FormActionModel {
  public async getRuntimeFlowSettingSteps(flowKey: string): Promise<Record<string, StepDefinition> | undefined> {
    if (flowKey !== 'clickSettings') {
      return undefined;
    }

    return getJSActionRuntimeFlowSettingSteps(this);
  }
}

JSFormActionModel.define({
  label: tExpr('JS action'),
  sort: 9999,
});

JSFormActionModel.registerFlow({
  key: 'clickSettings',
  on: 'click',
  title: tExpr('Click settings'),
  steps: {
    sourceMode: createJSActionSourceModeStep(),
    sourceBinding: createJSActionSourceBindingStep(),
    runJs: {
      title: tExpr('Write JavaScript'),
      useRawParams: true,
      uiSchema: createJSActionRunJsUISchema(),
      uiMode: createJSActionEmbeddedEditorUIMode,
      defaultParams(ctx) {
        return {
          version: 'v2',
          sourceMode: INLINE_SOURCE_MODE,
          code: `
const values = ctx.form?.getFieldsValue?.() || {};
ctx.message.success('Current form values: ' + JSON.stringify(values));
`,
        };
      },
      async handler(ctx, params) {
        const { code, version } = resolveRunJsParams(ctx, params);
        ctx.defineMethod('refresh', async () => {
          if (ctx.blockModel?.resource?.refresh) {
            await ctx.blockModel.resource.refresh();
          } else if (ctx.resource?.refresh) {
            await ctx.resource.refresh();
          }
        });
        await runJSActionRuntime({
          ctx,
          params: params || {},
          runJs: { code, version },
        });
      },
    },
  },
});
