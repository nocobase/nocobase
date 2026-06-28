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
import { operators } from '../../flow-compat';

function hasPersistedRuleItem(value: unknown, item: FieldAssignRuleItem, index: number): boolean {
  if (!Array.isArray(value)) return false;
  if (item?.key) {
    return value.some(
      (rule) => Boolean(rule) && typeof rule === 'object' && (rule as { key?: unknown }).key === item.key,
    );
  }
  return Boolean(value[index]);
}

const FilterFormDefaultValuesUI = observer(
  (props: { value?: FieldAssignRuleItem[]; onChange?: (value: FieldAssignRuleItem[]) => void }) => {
    const { value: propValue, onChange } = props;
    const ctx = useFlowContext();
    const t = ctx.model.translate.bind(ctx.model);
    const { isTitleFieldCandidate, onSyncAssociationTitleField } = useAssociationTitleFieldSync(t);
    const canEdit = typeof onChange === 'function';

    const fieldOptions = React.useMemo(() => {
      return collectFieldAssignCascaderOptions({ formBlockModel: ctx.model, t });
    }, [ctx.model, t]);

    const legacyDefaults = React.useMemo(() => {
      return collectLegacyDefaultValueRulesFromFilterFormModel(ctx.model);
    }, [ctx.model]);

    const hasPersistedValue = React.useMemo(() => {
      return hasPersistedAssignRulesValue(ctx.model, 'formFilterBlockModelSettings', 'defaultValues');
    }, [ctx.model]);

    const getValueInputProps = React.useCallback(
      (item: FieldAssignRuleItem, index: number) => {
        const targetPath = item?.targetPath ? String(item.targetPath) : '';
        const ruleKey = item?.key || index;
        const persistedValue = ctx.model?.getStepParams?.('formFilterBlockModelSettings', 'defaultValues')?.value;
        const hasSource = ctx.model?.uid && hasPersistedRuleItem(persistedValue, item, index);
        const sourceProps = {
          sourceLocator: hasSource
            ? {
                kind: 'flowModel.nestedRunJS' as const,
                modelUid: ctx.model.uid,
                containerFlowKey: 'formFilterBlockModelSettings',
                containerStepKey: 'defaultValues',
                valuePath: ['value', ruleKey, 'value'],
                scene: 'filterFormDefaultValues',
              }
            : undefined,
          sourceLabel: `${t('Field values')} / ${t('RunJS')}`,
          surfaceStyle: 'value' as const,
        };
        if (!targetPath) return sourceProps;
        const fieldModel: any = findFormItemModelByFieldPath(ctx.model, targetPath);
        if (!fieldModel) return sourceProps;
        const operator = getDefaultOperator(fieldModel);
        const opList =
          fieldModel?.collectionField?.filterable?.operators ||
          (fieldModel?.context?.filterField?.type ? (operators as any)?.[fieldModel.context.filterField.type] : []) ||
          [];
        return {
          ...sourceProps,
          operator,
          operatorMetaList: opList,
          preferFormItemFieldModel: true,
        };
      },
      [ctx.model, t],
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
      return Array.isArray(propValue) ? propValue : [];
    }, [propValue]);

    const legacyAwareValue = React.useMemo(() => {
      if (hasPersistedValue) {
        return normalizedValue;
      }
      return mergeAssignRulesWithLegacyDefaults(propValue, legacyDefaults);
    }, [hasPersistedValue, legacyDefaults, normalizedValue, propValue]);

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
        onChange?.(next);
      },
      [canEdit, markInitialized, onChange],
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
        onChange?.(legacyAwareValue);
      }
      markInitialized();
    }, [canEdit, hasPersistedValue, legacyAwareValue, markInitialized, normalizedValue, onChange]);

    return (
      <FieldAssignRulesEditor
        t={t}
        fieldOptions={fieldOptions}
        rootCollection={getCollectionFromModel(ctx.model)}
        value={value}
        onChange={handleChange}
        showValueEditorWhenNoField
        getValueInputProps={getValueInputProps}
        isTitleFieldCandidate={isTitleFieldCandidate}
        onSyncAssociationTitleField={onSyncAssociationTitleField}
        enableDateVariableAsConstant
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
