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
import { message } from 'antd';
import { useAPIClient, useDataSourceManager } from '@nocobase/client';
import {
  FieldAssignRulesEditor,
  type FieldAssignRuleItem,
  type SyncAssociationTitleFieldParams,
} from '../components/FieldAssignRulesEditor';
import { collectFieldAssignCascaderOptions } from '../components/fieldAssignOptions';
import { getCollectionFromModel } from '../internal/utils/modelUtils';
import { isTitleUsableField, syncCollectionTitleField } from '../internal/utils/titleFieldQuickSync';
import {
  collectLegacyDefaultValueRulesFromFormModel,
  mergeAssignRulesWithLegacyDefaults,
} from '../models/blocks/form/legacyDefaultValueMigration';

const FormAssignRulesUI = observer(
  (props: { value?: FieldAssignRuleItem[]; onChange?: (value: FieldAssignRuleItem[]) => void }) => {
    const ctx = useFlowContext();
    const api = useAPIClient();
    const dataSourceManager = useDataSourceManager();
    const t = ctx.model.translate.bind(ctx.model);
    const canEdit = typeof props.onChange === 'function';

    const fieldOptions = React.useMemo(() => {
      return collectFieldAssignCascaderOptions({ formBlockModel: ctx.model, t });
    }, [ctx.model]);

    const legacyDefaults = React.useMemo(() => {
      return collectLegacyDefaultValueRulesFromFormModel(ctx.model);
    }, [ctx.model]);

    // 兼容：将字段级默认值（editItemSettings/formItemSettings.initialValue）合并到表单级 assignRules 里展示。
    // 仅在首次打开时合并，后续以当前 step 表单值为准（便于用户在此处编辑/删除后统一保存）。
    const hasInitializedMergeRef = React.useRef(false);
    const [hasInitializedMerge, setHasInitializedMerge] = React.useState(false);
    const markInitialized = React.useCallback(() => {
      if (hasInitializedMergeRef.current) return;
      hasInitializedMergeRef.current = true;
      setHasInitializedMerge(true);
    }, []);

    const normalizedValue = React.useMemo(() => {
      const base = Array.isArray(props.value) ? props.value : [];
      return base;
    }, [props.value]);

    const value = React.useMemo(() => {
      if (!canEdit || !hasInitializedMerge) {
        return mergeAssignRulesWithLegacyDefaults(props.value, legacyDefaults);
      }
      return normalizedValue;
    }, [canEdit, hasInitializedMerge, legacyDefaults, normalizedValue, props.value]);

    const handleChange = React.useCallback(
      (next: FieldAssignRuleItem[]) => {
        if (!canEdit) return;
        markInitialized();
        props.onChange?.(next);
      },
      [canEdit, markInitialized, props.onChange],
    );

    // 仅在首次打开时，把合并结果写回到当前 step 表单状态，后续不再自动合并（以免重复添加）。
    React.useEffect(() => {
      if (hasInitializedMergeRef.current) return;
      if (!canEdit) return;

      const merged = mergeAssignRulesWithLegacyDefaults(props.value, legacyDefaults);
      const nextValue = merged;

      if (!isEqual(props.value || [], nextValue || [])) {
        props.onChange?.(nextValue);
      }
      markInitialized();
    }, [canEdit, legacyDefaults, markInitialized, props.onChange, props.value]);

    const isTitleFieldCandidate = React.useCallback(
      (field: any) => {
        return isTitleUsableField(dataSourceManager, field);
      },
      [dataSourceManager],
    );

    const handleSyncAssociationTitleField = React.useCallback(
      async ({ targetCollection, titleField }: SyncAssociationTitleFieldParams) => {
        try {
          await syncCollectionTitleField({
            api,
            dataSourceManager,
            targetCollection,
            titleField,
          });
          message.success(t('Saved successfully'));
        } catch (error: any) {
          const msg = error?.message ? String(error.message) : t('Save failed');
          message.error(msg);
          throw error;
        }
      },
      [api, dataSourceManager, t],
    );

    return (
      <FieldAssignRulesEditor
        t={t}
        fieldOptions={fieldOptions}
        rootCollection={getCollectionFromModel(ctx.model)}
        value={value}
        onChange={handleChange}
        showValueEditorWhenNoField
        isTitleFieldCandidate={isTitleFieldCandidate}
        onSyncAssociationTitleField={handleSyncAssociationTitleField}
      />
    );
  },
);

export const formAssignRules = defineAction({
  name: 'formAssignRules',
  title: tExpr('Field values'),
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
