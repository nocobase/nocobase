/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, observer, tExpr, useFlowContext } from '@nocobase/flow-engine';
import type { FieldAssignRuleItem } from '../components/FieldAssignRulesEditor';
import React from 'react';
import { FieldAssignRulesEditor } from '../components/FieldAssignRulesEditor';

const FormAssignRulesUI = observer((props: { value?: FieldAssignRuleItem[]; onChange?: (value: any) => void }) => {
  const ctx = useFlowContext();
  const t = ctx.model.translate.bind(ctx.model);

  const onChange = props.onChange;

  const fieldOptions = React.useMemo(() => {
    try {
      const items = ctx.model?.subModels?.grid?.subModels?.items || [];
      return items.map((model: any) => ({
        label: model.props?.label || model.props?.name,
        value: model.uid,
      }));
    } catch {
      return [];
    }
  }, [ctx.model]);

  return (
    <FieldAssignRulesEditor
      t={t}
      fieldOptions={fieldOptions}
      value={props.value as any}
      onChange={onChange as any}
      showValueEditorWhenNoField
    />
  );
});

export const formAssignRules = defineAction({
  name: 'formAssignRules',
  title: tExpr('Assign field values'),
  useRawParams: true,
  uiMode: 'embed',
  uiSchema() {
    return {
      value: {
        type: 'array',
        'x-component': FormAssignRulesUI,
      },
    };
  },
  defaultParams: {
    value: [],
  },
  handler(ctx, params) {
    const items = (params?.value || []) as FieldAssignRuleItem[];
    // 将配置同步到运行时规则引擎（若存在），使其在预览/运行态立刻生效
    try {
      (ctx.model as any)?.formValueRuntime?.syncAssignRules?.(items);
    } catch {
      // ignore
    }
  },
});
