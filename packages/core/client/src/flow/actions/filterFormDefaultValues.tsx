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
import { useAssociationTitleFieldSync } from '../components/useAssociationTitleFieldSync';
import { findFormItemModelByFieldPath, getCollectionFromModel } from '../internal/utils/modelUtils';
import {
  collectLegacyDefaultValueRulesFromFilterFormModel,
  mergeAssignRulesWithLegacyDefaults,
} from '../models/blocks/filter-form/legacyDefaultValueMigration';
import { getDefaultOperator } from '../models/blocks/filter-manager/utils';
import { operators } from '../../collection-manager';

const FilterFormDefaultValuesUI = observer(
  (props: { value?: FieldAssignRuleItem[]; onChange?: (value: FieldAssignRuleItem[]) => void }) => {
    const ctx = useFlowContext();
    const t = ctx.model.translate.bind(ctx.model);
    const { isTitleFieldCandidate, onSyncAssociationTitleField } = useAssociationTitleFieldSync(t);
    const canEdit = typeof props.onChange === 'function';

    const fieldOptions = React.useMemo(() => {
      return collectFieldAssignCascaderOptions({ formBlockModel: ctx.model, t });
    }, [ctx.model]);

    const legacyDefaults = React.useMemo(() => {
      return collectLegacyDefaultValueRulesFromFilterFormModel(ctx.model);
    }, [ctx.model]);

    const getValueInputProps = React.useCallback(
      (item: FieldAssignRuleItem) => {
        const targetPath = item?.targetPath ? String(item.targetPath) : '';
        if (!targetPath) return {};
        const fieldModel: any = findFormItemModelByFieldPath(ctx.model, targetPath);
        if (!fieldModel) return {};
        const operator = getDefaultOperator(fieldModel);
        const opList =
          fieldModel?.collectionField?.filterable?.operators ||
          (fieldModel?.context?.filterField?.type ? (operators as any)?.[fieldModel.context.filterField.type] : []) ||
          [];
        return {
          operator,
          operatorMetaList: opList,
          preferFormItemFieldModel: true,
        };
      },
      [ctx.model],
    );

    // 兼容：将字段级默认值（filterFormItemSettings.initialValue）合并到表单级 defaultValues 里展示。
    // 仅在首次打开时合并，后续以当前 step 表单值为准（便于用户在此处编辑/删除后统一保存）。
    const hasInitializedMergeRef = React.useRef(false);
    const [hasInitializedMerge, setHasInitializedMerge] = React.useState(false);
    const markInitialized = React.useCallback(() => {
      if (hasInitializedMergeRef.current) return;
      hasInitializedMergeRef.current = true;
      setHasInitializedMerge(true);
    }, []);

    const value = React.useMemo(() => {
      if (!canEdit || !hasInitializedMerge) {
        return mergeAssignRulesWithLegacyDefaults(props.value, legacyDefaults);
      }
      return Array.isArray(props.value) ? props.value : [];
    }, [canEdit, hasInitializedMerge, legacyDefaults, props.value]);

    const handleChange = React.useCallback(
      (next: FieldAssignRuleItem[]) => {
        if (!canEdit) return;
        markInitialized();
        props.onChange?.(next);
      },
      [canEdit, markInitialized, props.onChange],
    );

    // 仅在首次打开时，把合并结果写回到当前 step 表单状态，后续不再自动合并。
    React.useEffect(() => {
      if (hasInitializedMergeRef.current) return;
      if (!canEdit) return;

      const nextValue = mergeAssignRulesWithLegacyDefaults(props.value, legacyDefaults);
      if (!isEqual(props.value || [], nextValue || [])) {
        props.onChange?.(nextValue);
      }
      markInitialized();
    }, [canEdit, legacyDefaults, markInitialized, props.onChange, props.value]);

    return (
      <FieldAssignRulesEditor
        t={t}
        fieldOptions={fieldOptions}
        rootCollection={getCollectionFromModel(ctx.model)}
        value={value}
        onChange={handleChange}
        fixedMode="default"
        showCondition={false}
        showValueEditorWhenNoField
        getValueInputProps={getValueInputProps}
        isTitleFieldCandidate={isTitleFieldCandidate}
        onSyncAssociationTitleField={onSyncAssociationTitleField}
      />
    );
  },
);

export const filterFormDefaultValues = defineAction({
  name: 'filterFormDefaultValues',
  title: tExpr('Field values'),
  useRawParams: true,
  uiMode: 'embed',
  uiSchema() {
    return {
      value: {
        type: 'array',
        'x-component': FilterFormDefaultValuesUI,
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
