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
import { FieldAssignRulesEditor } from '../components/FieldAssignRulesEditor';
import type { FieldAssignRuleItem } from '../components/FieldAssignRulesEditor';
import { collectFieldAssignCascaderOptions } from '../components/fieldAssignOptions';
import { useAssociationTitleFieldSync } from '../components/useAssociationTitleFieldSync';
import { findFormItemModelByFieldPath, getCollectionFromModel } from '../internal/utils/modelUtils';
import {
  collectLegacyDefaultValueRulesFromFilterFormModel,
  mergeAssignRulesWithLegacyDefaults,
} from '../models/blocks/filter-form/legacyDefaultValueMigration';
import { hasPersistedAssignRulesValue } from '../models/blocks/shared/legacyDefaultValueMigrationBase';
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

    const hasPersistedValue = React.useMemo(() => {
      return hasPersistedAssignRulesValue(ctx.model, 'formFilterBlockModelSettings', 'defaultValues');
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
    // 仅在表单级 defaultValues.value 尚未持久化时合并；已保存的空数组也代表用户显式删除。
    const hasInitializedMergeRef = React.useRef(false);
    const [hasInitializedMerge, setHasInitializedMerge] = React.useState(false);
    const markInitialized = React.useCallback(() => {
      if (hasInitializedMergeRef.current) return;
      hasInitializedMergeRef.current = true;
      setHasInitializedMerge(true);
    }, []);

    const normalizedValue = React.useMemo(() => {
      return Array.isArray(props.value) ? props.value : [];
    }, [props.value]);

    const legacyAwareValue = React.useMemo(() => {
      if (hasPersistedValue) {
        return normalizedValue;
      }
      return mergeAssignRulesWithLegacyDefaults(props.value, legacyDefaults);
    }, [hasPersistedValue, legacyDefaults, normalizedValue, props.value]);

    const value = React.useMemo(() => {
      if (!canEdit || !hasInitializedMerge) {
        return legacyAwareValue;
      }
      return normalizedValue;
    }, [canEdit, hasInitializedMerge, legacyAwareValue, normalizedValue]);

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

      if (hasPersistedValue) {
        markInitialized();
        return;
      }

      if (!isEqual(normalizedValue, legacyAwareValue)) {
        props.onChange?.(legacyAwareValue);
      }
      markInitialized();
    }, [canEdit, hasPersistedValue, legacyAwareValue, markInitialized, normalizedValue, props.onChange]);

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
