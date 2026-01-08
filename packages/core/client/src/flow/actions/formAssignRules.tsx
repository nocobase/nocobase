/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, observer, tExpr, useFlowContext } from '@nocobase/flow-engine';
import React from 'react';
import { FieldAssignRulesEditor, type FieldAssignRuleItem } from '../components/FieldAssignRulesEditor';

const FormAssignRulesUI = observer((props: { value?: FieldAssignRuleItem[]; onChange?: (value: any) => void }) => {
  const ctx = useFlowContext();
  const t = ctx.model.translate.bind(ctx.model);

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
      onChange={props.onChange as any}
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
  handler() {
    // UI-only action; persistence is handled by flow settings.
  },
});
