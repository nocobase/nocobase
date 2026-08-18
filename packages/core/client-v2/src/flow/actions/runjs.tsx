/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionScene, defineAction, tExpr } from '@nocobase/flow-engine';
import { useForm } from '@formily/react';
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
  const form = useForm();
  const code = props.value || '';
  const version = resolveDynamicFlowRunJSVersion(code, form.values?.version);

  return (
    <RunJSEditorField
      value={{ code, version }}
      onChange={(value) => {
        const nextCode = typeof value === 'string' ? value : value.code;
        const nextVersion =
          typeof value === 'string' ? version : resolveDynamicFlowRunJSVersion(nextCode, value.version);
        form.setValuesIn('version', nextVersion);
        props.onChange?.(nextCode);
      }}
      scene="eventFlow"
      height="200px"
      sourceLocator={props.sourceLocator}
      sourceLabel={props.sourceLabel}
      surfaceStyle="action"
    />
  );
};

export function resolveDynamicFlowRunJSVersion(code: unknown, version: unknown): string {
  if (typeof version === 'string' && version.trim()) {
    return version;
  }
  return typeof code === 'string' && code.trim() ? 'v1' : 'v2';
}

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

    return ctx.runjs(params.code, undefined, {
      version: resolveDynamicFlowRunJSVersion(params.code, params.version),
    });
  },
});
