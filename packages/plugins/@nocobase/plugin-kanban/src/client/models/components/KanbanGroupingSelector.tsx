/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, useForm } from '@formily/react';
import { useFlowSettingsContext } from '@nocobase/flow-engine';
import { Alert, Select, Space, Spin } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { KanbanBlockModel } from '../KanbanBlockModel';
import {
  areKanbanGroupOptionsEqual,
  getKanbanInlineGroupOptions,
  isAssociationGroupField,
  normalizeKanbanGroupOptions,
  type KanbanGroupOption,
  type KanbanGroupingValue,
} from '../utils';

const getGroupingOptionKey = (value: any) => String(value?.value ?? value ?? '');

const isGroupingValue = (value: unknown): value is KanbanGroupingValue => {
  return Boolean(value && !Array.isArray(value) && typeof value === 'object');
};

const getGroupOptions = (value?: KanbanGroupOption[] | KanbanGroupingValue) => {
  return Array.isArray(value) ? value : value?.groupOptions || [];
};

const buildSelectedGroupOptions = (availableOptions: KanbanGroupOption[], nextValues: any[]) => {
  const optionMap = new Map(availableOptions.map((option) => [getGroupingOptionKey(option), option] as const));

  return nextValues
    .map((value) => optionMap.get(getGroupingOptionKey(value)))
    .filter((option): option is KanbanGroupOption => Boolean(option));
};

export const KanbanGroupingSelector = observer(
  ({
    value,
    onChange,
    model,
    collection,
    disabled,
  }: {
    value?: KanbanGroupOption[] | KanbanGroupingValue;
    onChange?: (value: KanbanGroupOption[]) => void;
    model?: KanbanBlockModel;
    collection?: any;
    dataSourceKey?: string;
    disabled?: boolean;
  }) => {
    const form = useForm();
    let settingsContext: any;
    try {
      settingsContext = useFlowSettingsContext<KanbanBlockModel>();
    } catch (error) {
      settingsContext = undefined;
    }

    const resolvedModel = model || settingsContext?.model;
    const resolvedCollection = resolvedModel?.collection || collection || settingsContext?.collection;

    const translate = useCallback(
      (key: string) => resolvedModel?.translate?.(key, { ns: 'kanban' }) || key,
      [resolvedModel],
    );
    const [optionsLoading, setOptionsLoading] = useState(false);
    const [optionsError, setOptionsError] = useState<string>();
    const grouping = (form?.values?.grouping || (isGroupingValue(value) ? value : {}) || {}) as KanbanGroupingValue;
    const resolvedFieldName = grouping.groupField;
    const currentField = useMemo(() => {
      return resolvedFieldName ? resolvedCollection?.getField?.(resolvedFieldName) : undefined;
    }, [resolvedCollection, resolvedFieldName]);

    const groupOptions = useMemo(() => getGroupOptions(value), [value]);
    const [availableOptions, setAvailableOptions] = useState<KanbanGroupOption[]>(groupOptions);

    const emitChange = useCallback(
      (nextOptions: KanbanGroupOption[]) => {
        if (!onChange) {
          return;
        }

        if (form?.values?.grouping || !isGroupingValue(value)) {
          onChange(nextOptions as any);
          return;
        }

        onChange({
          ...value,
          groupOptions: nextOptions,
        } as any);
      },
      [form, onChange, value],
    );

    useEffect(() => {
      let cancelled = false;

      const syncOptions = async () => {
        if (!currentField || !onChange) {
          setAvailableOptions([]);
          return;
        }

        setOptionsLoading(true);
        setOptionsError(undefined);

        try {
          const inlineGroupOptions = resolvedModel?.getInlineGroupOptions(currentField);
          const sourceOptions = inlineGroupOptions?.length
            ? inlineGroupOptions
            : getKanbanInlineGroupOptions(currentField, groupOptions);
          const groupTitleField = isAssociationGroupField(currentField)
            ? grouping.groupTitleField || resolvedModel?.getGroupTitleFieldName(currentField)
            : undefined;
          const groupColorField = isAssociationGroupField(currentField)
            ? grouping.groupColorField || resolvedModel?.getGroupColorFieldName(currentField)
            : undefined;

          const nextOptions = sourceOptions.length
            ? normalizeKanbanGroupOptions(sourceOptions, groupOptions)
            : resolvedModel
              ? await resolvedModel.loadRelationGroupOptions(currentField, {
                  titleFieldName: groupTitleField,
                  colorFieldName: groupColorField,
                  savedOptions: groupOptions,
                })
              : [];

          if (cancelled) {
            return;
          }

          setAvailableOptions(nextOptions);

          if (!groupOptions.length) {
            return;
          }

          const selectedKeys = new Set(groupOptions.map((item) => getGroupingOptionKey(item)));
          const isSelectedGroupOption = (item: KanbanGroupOption) => selectedKeys.has(getGroupingOptionKey(item));
          const nextGroupOptions = nextOptions.filter(isSelectedGroupOption);

          if (areKanbanGroupOptionsEqual(groupOptions, nextGroupOptions)) {
            return;
          }

          emitChange(nextGroupOptions);
        } catch (error: any) {
          if (!cancelled) {
            setOptionsError(error?.message || translate('Failed to load group options'));
          }
        } finally {
          if (!cancelled) {
            setOptionsLoading(false);
          }
        }
      };

      void syncOptions();

      return () => {
        cancelled = true;
      };
    }, [
      currentField,
      form,
      groupOptions,
      grouping.groupColorField,
      grouping.groupTitleField,
      onChange,
      resolvedModel,
      translate,
      value,
      emitChange,
    ]);

    const selectedValues = groupOptions.map((item) => item.value);

    return (
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {optionsError ? <Alert type="error" message={optionsError} showIcon /> : null}
        <Spin spinning={optionsLoading}>
          <Select
            mode="multiple"
            disabled={disabled || !currentField}
            style={{ width: '100%' }}
            value={selectedValues}
            options={availableOptions.map((option) => ({
              label: option.label,
              value: option.value,
            }))}
            placeholder={translate(currentField ? 'Select group values' : 'Select a grouping field first')}
            onChange={(nextValues) => {
              emitChange(buildSelectedGroupOptions(availableOptions, nextValues));
            }}
          />
        </Spin>
      </Space>
    );
  },
);

KanbanGroupingSelector.displayName = 'KanbanGroupingSelector';
