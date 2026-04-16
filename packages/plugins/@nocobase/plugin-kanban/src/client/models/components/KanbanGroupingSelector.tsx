/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@formily/react';
import { useCollectionManager_deprecated } from '@nocobase/client';
import { MultiRecordResource, useFlowSettingsContext } from '@nocobase/flow-engine';
import { Alert, Empty, Select, Space, Spin, Switch, Tag } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { KanbanBlockModel } from '../KanbanBlockModel';
import {
  isSameKanbanGroupingValue,
  getKanbanGroupFieldCandidates,
  getKanbanInlineGroupOptions,
  KANBAN_COLOR_OPTIONS,
  normalizeKanbanGroupOptions,
  type KanbanGroupOption,
} from '../utils';

type GroupingValue = {
  groupField?: string;
  groupOptions?: KanbanGroupOption[];
};

type RelationOptionRecord = {
  [key: string]: any;
};

const loadRelationGroupOptions = async (model: KanbanBlockModel, field: any): Promise<KanbanGroupOption[]> => {
  const targetCollection = field?.targetCollection;
  if (!targetCollection) {
    return [];
  }

  const params = model.getResourceSettingsInitParams();
  const resource = model.context.createResource(MultiRecordResource);
  resource.setDataSourceKey(params.dataSourceKey);
  resource.setResourceName(targetCollection.name);
  resource.setPage(1);
  resource.setPageSize(200);
  resource.setSort([targetCollection.titleField || targetCollection.getFilterTargetKey()]);
  await resource.refresh();

  const titleField = targetCollection.titleField || targetCollection.getFilterTargetKey();
  const filterTargetKey = targetCollection.getFilterTargetKey();

  return normalizeKanbanGroupOptions(
    (resource.getData() as RelationOptionRecord[]).map((item) => ({
      label: item?.[titleField] || item?.[filterTargetKey],
      value: item?.[filterTargetKey],
    })),
  );
};

export const KanbanGroupingSelector = observer(
  ({
    value,
    onChange,
    model,
    collection,
    dataSourceKey,
  }: {
    value?: GroupingValue;
    onChange?: (value: GroupingValue) => void;
    model?: KanbanBlockModel;
    collection?: any;
    dataSourceKey?: string;
  }) => {
    let settingsContext: any;
    try {
      settingsContext = useFlowSettingsContext<KanbanBlockModel>();
    } catch (error) {
      settingsContext = undefined;
    }

    const resolvedModel = model || settingsContext?.model;
    const resolvedCollection = resolvedModel?.collection || collection || settingsContext?.collection;
    const resolvedDataSourceKey =
      resolvedCollection?.dataSourceKey || dataSourceKey || settingsContext?.dataSource?.key;
    const cm = useCollectionManager_deprecated(resolvedDataSourceKey);
    const translate = useCallback((key: string) => resolvedModel?.translate?.(key) || key, [resolvedModel]);
    const [optionsLoading, setOptionsLoading] = useState(false);
    const [optionsError, setOptionsError] = useState<string>();
    const groupFieldOptions = useMemo(() => {
      return resolvedModel?.getGroupFieldCandidates() || getKanbanGroupFieldCandidates(resolvedCollection);
    }, [resolvedModel, resolvedCollection]);
    const resolvedFieldName = value?.groupField || groupFieldOptions[0]?.value;
    const currentField = useMemo(() => {
      return resolvedFieldName ? resolvedCollection?.getField?.(resolvedFieldName) : undefined;
    }, [resolvedCollection, resolvedFieldName]);

    useEffect(() => {
      let cancelled = false;

      const syncOptions = async () => {
        if (!currentField) {
          return;
        }

        setOptionsLoading(true);
        setOptionsError(undefined);

        try {
          const sourceOptions =
            resolvedModel?.getInlineGroupOptions(currentField) || getKanbanInlineGroupOptions(currentField);
          const nextOptions = sourceOptions.length
            ? sourceOptions
            : resolvedModel
              ? await loadRelationGroupOptions(resolvedModel, currentField)
              : [];
          if (cancelled) {
            return;
          }

          const nextValue = {
            groupField: currentField.name,
            groupOptions: normalizeKanbanGroupOptions(nextOptions, value?.groupOptions || []),
          };

          if (isSameKanbanGroupingValue(value, nextValue)) {
            return;
          }

          onChange?.(nextValue);
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

      if (!currentField || !onChange) {
        return;
      }

      void syncOptions();

      return () => {
        cancelled = true;
      };
    }, [cm, currentField, onChange, resolvedModel, translate, value]);

    const groupOptions = value?.groupOptions || [];

    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Select
          style={{ width: '100%' }}
          value={resolvedFieldName}
          options={groupFieldOptions}
          onChange={(groupField) => {
            onChange?.({ groupField, groupOptions: [] });
          }}
          placeholder={translate('Grouping field')}
        />
        {optionsError ? <Alert type="error" message={optionsError} showIcon /> : null}
        <Spin spinning={optionsLoading}>
          {groupOptions.length ? (
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {groupOptions.map((option) => {
                return (
                  <div
                    key={option.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '8px 12px',
                      border: '1px solid var(--nb-border-color, #f0f0f0)',
                      borderRadius: 8,
                    }}
                  >
                    <Space size={12} style={{ flex: 1, minWidth: 0 }}>
                      <Switch
                        checked={option.enabled !== false}
                        onChange={(enabled) => {
                          onChange?.({
                            groupField: resolvedFieldName,
                            groupOptions: groupOptions.map((item) => {
                              if (item.value !== option.value) {
                                return item;
                              }
                              return { ...item, enabled };
                            }),
                          });
                        }}
                      />
                      <Tag color={option.color}>{option.label}</Tag>
                    </Space>
                    <Select
                      style={{ width: 140 }}
                      value={option.color}
                      options={KANBAN_COLOR_OPTIONS.map((color) => ({
                        label: <Tag color={color}>{color}</Tag>,
                        value: color,
                      }))}
                      onChange={(color) => {
                        onChange?.({
                          groupField: resolvedFieldName,
                          groupOptions: groupOptions.map((item) => {
                            if (item.value !== option.value) {
                              return item;
                            }
                            return { ...item, color };
                          }),
                        });
                      }}
                    />
                  </div>
                );
              })}
            </Space>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={translate('No options')} />
          )}
        </Spin>
      </Space>
    );
  },
);

KanbanGroupingSelector.displayName = 'KanbanGroupingSelector';
