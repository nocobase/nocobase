/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr, type StepDefinition } from '@nocobase/flow-engine';
import type { ButtonProps } from 'antd/es/button';
import { ActionSceneEnum, RecordActionModel } from '../base';
import { resolveRunJsParams } from '../utils/resolveRunJsParams';
import {
  createJSActionEmbeddedEditorUIMode,
  createJSActionRunJsUISchema,
  createJSActionSourceBindingStep,
  createJSActionSourceModeStep,
  getJSActionRuntimeFlowSettingSteps,
  INLINE_SOURCE_MODE,
  runJSActionRuntime,
} from './jsActionLightExtensionRuntime';

export class JSRecordActionModel extends RecordActionModel {
  static scene = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    type: 'link',
    title: tExpr('JS action'),
    icon: 'JavaScriptOutlined',
  };

  public async getRuntimeFlowSettingSteps(flowKey: string): Promise<Record<string, StepDefinition> | undefined> {
    if (flowKey !== 'clickSettings') {
      return undefined;
    }

    return getJSActionRuntimeFlowSettingSteps(this);
  }
}

JSRecordActionModel.define({
  label: tExpr('JS action'),
  sort: 9999,
  createModelOptions: {
    use: 'JSRecordActionModel',
  },
});

JSRecordActionModel.registerFlow({
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
if (!ctx.record) {
  ctx.message.error('No record');
} else {
  ctx.message.success('Record ID: ' + (ctx.filterByTk ?? ctx.record?.id));
}
`,
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
