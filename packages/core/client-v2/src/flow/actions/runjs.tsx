/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionScene, defineAction, tExpr } from '@nocobase/flow-engine';
import React from 'react';
import type { RunJSSourceLocator } from '../components/runjs-studio';
import { RunJSEditorField } from '../components/runjs-studio';

type DynamicEventFlowRunJSCodeEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
  sourceLocator?: RunJSSourceLocator;
  sourceLabel?: string;
};

const DynamicEventFlowRunJSCodeEditor: React.FC<DynamicEventFlowRunJSCodeEditorProps> = (props) => {
  return (
    <RunJSEditorField
      value={{ code: props.value || '', version: 'v2' }}
      onChange={(value) => props.onChange?.(typeof value === 'string' ? value : value.code)}
      scene="eventFlow"
      height="200px"
      sourceLocator={props.sourceLocator}
      sourceLabel={props.sourceLabel}
      surfaceStyle="action"
    />
  );
};

export const runjs = defineAction({
  name: 'runjs',
  title: tExpr('Execute JavaScript'),
  scene: [ActionScene.DYNAMIC_EVENT_FLOW],
  sort: 10000, // 排到最后
  useRawParams: true,
  uiSchema: {
    code: {
      type: 'string',
      'x-component': DynamicEventFlowRunJSCodeEditor,
      'x-component-props': {},
    },
  },
  async handler(ctx, params) {
    // 如果是 URL 触发的，则不执行代码
    if (ctx.inputArgs?.navigation) return;

    return ctx.runjs(params.code);
  },
});
