/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, observer, tExpr, useFlowContext } from '@nocobase/flow-engine';
import { isEqual } from 'lodash';
import React from 'react';
import { FieldAssignRulesEditor, type FieldAssignRuleItem } from '../components/FieldAssignRulesEditor';
import { collectFieldAssignCascaderOptions } from '../components/fieldAssignOptions';
import { getCollectionFromModel } from '../internal/utils/modelUtils';
import {
  collectLegacyDefaultValueRulesFromFormModel,
  mergeAssignRulesWithLegacyDefaults,
} from '../models/blocks/form/legacyDefaultValueMigration';

const FormAssignRulesUI = observer(
  (props: { value?: FieldAssignRuleItem[]; onChange?: (value: FieldAssignRuleItem[]) => void }) => {
    const ctx = useFlowContext();
    const t = ctx.model.translate.bind(ctx.model);

    const fieldOptions = React.useMemo(() => {
      return collectFieldAssignCascaderOptions({ formBlockModel: ctx.model, t });
    }, [ctx.model]);

    // 兼容：将字段级默认值（editItemSettings/formItemSettings.initialValue）合并到表单级 assignRules 里展示
    const mergedValue = React.useMemo(() => {
      const legacyDefaults = collectLegacyDefaultValueRulesFromFormModel(ctx.model);
      return mergeAssignRulesWithLegacyDefaults(props.value, legacyDefaults);
    }, [ctx.model, props.value]);

    // 仅在首次打开时，把合并结果写回到当前 step 表单状态，便于用户在此处编辑/删除后统一保存
    const hasInitializedMergeRef = React.useRef(false);
    React.useEffect(() => {
      if (hasInitializedMergeRef.current) return;
      hasInitializedMergeRef.current = true;
      if (typeof props.onChange !== 'function') return;
      if (!isEqual(props.value || [], mergedValue || [])) {
        props.onChange(mergedValue);
      }
    }, [mergedValue, props.onChange, props.value]);

    return (
      <FieldAssignRulesEditor
        t={t}
        fieldOptions={fieldOptions}
        rootCollection={getCollectionFromModel(ctx.model)}
        value={mergedValue}
        onChange={props.onChange}
        showValueEditorWhenNoField
      />
    );
  },
);

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
