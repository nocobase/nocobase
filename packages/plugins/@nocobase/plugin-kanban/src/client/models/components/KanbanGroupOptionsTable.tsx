/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MenuOutlined } from '@ant-design/icons';
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { observer } from '@formily/react';
import { useAPIClient, useCollectionManager_deprecated } from '@nocobase/client';
import { MultiRecordResource, useFlowSettingsContext } from '@nocobase/flow-engine';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';
import { Alert, Empty, Input, Select, Space, Spin, Switch, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { KanbanBlockModel } from '../KanbanBlockModel';
import {
  getKanbanCollectionField,
  getKanbanCollectionFilterTargetKey,
  getKanbanCollectionTitleField,
  isSameKanbanGroupingValue,
  KANBAN_COLOR_OPTIONS,
  normalizeKanbanGroupOptions,
  reorderKanbanGroupOptions,
  type KanbanGroupOption,
} from '../utils';

type GroupOptionsValue = KanbanGroupOption[];

type RelationOptionRecord = {
  [key: string]: any;
};

type SortableRowProps = React.HTMLAttributes<HTMLTableRowElement> & {
  'data-row-key': string;
};

const SortableRowContext = React.createContext<{
  attributes?: DraggableAttributes;
  listeners?: DraggableSyntheticListeners;
  setActivatorNodeRef?: (node: HTMLElement | null) => void;
} | null>(null);

const SortableRow = (props: SortableRowProps) => {
  const id = String(props['data-row-key']);
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    ...props.style,
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { position: 'relative' as const, zIndex: 1 } : null),
  };

  return (
    <SortableRowContext.Provider value={{ attributes, listeners, setActivatorNodeRef }}>
      <tr ref={setNodeRef} {...props} style={style} />
    </SortableRowContext.Provider>
  );
};

const SortHandle = () => {
  const dragContext = React.useContext(SortableRowContext);

  return (
    <span
      ref={dragContext?.setActivatorNodeRef}
      {...dragContext?.attributes}
      {...dragContext?.listeners}
      style={{ cursor: 'grab', display: 'inline-flex', alignItems: 'center' }}
    >
      <MenuOutlined />
    </span>
  );
};

const normalizeRelationGroupOptions = (
  records: RelationOptionRecord[],
  targetCollection: any,
  saved: KanbanGroupOption[] = [],
) => {
  const titleField = getKanbanCollectionTitleField(targetCollection);
  const filterTargetKey = getKanbanCollectionFilterTargetKey(targetCollection);

  return normalizeKanbanGroupOptions(
    records.map((item) => ({
      label: item?.[titleField] || item?.[filterTargetKey],
      value: item?.[filterTargetKey],
    })),
    saved,
  );
};

const loadRelationGroupOptions = async (
  model: KanbanBlockModel | undefined,
  field: any,
  api: any,
  dataSourceKey?: string,
  savedOptions: KanbanGroupOption[] = [],
): Promise<KanbanGroupOption[]> => {
  const targetCollection = field?.targetCollection;
  if (!targetCollection) {
    return [];
  }

  if (model) {
    const params = model.getResourceSettingsInitParams();
    const resource = model.context.createResource(MultiRecordResource);
    const sortField = getKanbanCollectionTitleField(targetCollection);
    resource.setDataSourceKey(params.dataSourceKey);
    resource.setResourceName(targetCollection.name);
    resource.setPage(1);
    resource.setPageSize(200);
    resource.setSort([sortField]);
    await resource.refresh();

    return normalizeRelationGroupOptions(resource.getData() as RelationOptionRecord[], targetCollection, savedOptions);
  }

  const response = await api.resource(targetCollection.name).list({
    paginate: false,
    sort: [getKanbanCollectionTitleField(targetCollection)],
    ...(dataSourceKey && dataSourceKey !== 'main' ? { dataSourceKey } : {}),
  });
  const rows = response?.data?.data || response?.data?.rows || response?.data || [];
  return normalizeRelationGroupOptions(Array.isArray(rows) ? rows : [], targetCollection, savedOptions);
};

export const KanbanGroupOptionsTable = observer(
  ({
    value,
    onChange,
    groupFieldName,
    model,
    collection,
    dataSourceKey,
  }: {
    value?: GroupOptionsValue;
    onChange?: (value: GroupOptionsValue) => void;
    groupFieldName?: string;
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

    const api = useAPIClient();
    const resolvedModel = model || settingsContext?.model;
    const resolvedCollection = resolvedModel?.collection || collection || settingsContext?.collection;
    const resolvedDataSourceKey =
      resolvedCollection?.dataSourceKey || dataSourceKey || settingsContext?.dataSource?.key;
    useCollectionManager_deprecated(resolvedDataSourceKey);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
    const translate = useCallback((key: string) => resolvedModel?.translate?.(key) || key, [resolvedModel]);
    const [optionsLoading, setOptionsLoading] = useState(false);
    const [optionsError, setOptionsError] = useState<string>();
    const groupOptions = useMemo(() => value || [], [value]);
    const currentField = useMemo(() => {
      return getKanbanCollectionField(resolvedCollection, groupFieldName);
    }, [groupFieldName, resolvedCollection]);

    useEffect(() => {
      let cancelled = false;

      const syncOptions = async () => {
        if (!currentField || !onChange) {
          return;
        }

        setOptionsLoading(true);
        setOptionsError(undefined);

        try {
          const nextOptions = await loadRelationGroupOptions(
            resolvedModel,
            currentField,
            api,
            resolvedDataSourceKey,
            groupOptions,
          );
          const normalizedOptions = nextOptions.length
            ? nextOptions
            : normalizeKanbanGroupOptions(currentField?.uiSchema?.enum || [], groupOptions);

          if (cancelled) {
            return;
          }

          if (
            isSameKanbanGroupingValue(
              { groupField: groupFieldName, groupOptions },
              { groupField: groupFieldName, groupOptions: normalizedOptions },
            )
          ) {
            return;
          }

          onChange(normalizedOptions);
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

      if (!groupFieldName) {
        if (groupOptions.length) {
          onChange?.([]);
        }
        return;
      }

      void syncOptions();

      return () => {
        cancelled = true;
      };
    }, [api, currentField, groupFieldName, groupOptions, onChange, resolvedDataSourceKey, resolvedModel, translate]);

    const dataSource = useMemo(() => {
      return groupOptions.map((item, index) => ({ ...item, key: item.value || String(index) }));
    }, [groupOptions]);

    const updateOptions = useCallback(
      (updater: (items: KanbanGroupOption[]) => KanbanGroupOption[]) => {
        onChange?.(updater(groupOptions));
      },
      [groupOptions, onChange],
    );

    const columns = useMemo<ColumnsType<KanbanGroupOption & { key: string }>>(
      () => [
        {
          title: translate('Sort'),
          dataIndex: 'sort',
          width: 72,
          render: () => <SortHandle />,
        },
        {
          title: translate('Label'),
          dataIndex: 'label',
          render: (_value, record) => (
            <Input
              value={record.label}
              onChange={(event) => {
                updateOptions((items) =>
                  items.map((item) => (item.value === record.value ? { ...item, label: event.target.value } : item)),
                );
              }}
            />
          ),
        },
        {
          title: translate('Color'),
          dataIndex: 'color',
          width: 180,
          render: (_value, record) => (
            <Select
              value={record.color}
              style={{ width: '100%' }}
              options={KANBAN_COLOR_OPTIONS.map((color) => ({
                label: <Tag color={color}>{color}</Tag>,
                value: color,
              }))}
              onChange={(color) => {
                updateOptions((items) =>
                  items.map((item) => (item.value === record.value ? { ...item, color } : item)),
                );
              }}
            />
          ),
        },
        {
          title: translate('Enabled'),
          dataIndex: 'enabled',
          width: 120,
          render: (_value, record) => (
            <Switch
              checked={record.enabled !== false}
              onChange={(enabled) => {
                updateOptions((items) =>
                  items.map((item) => (item.value === record.value ? { ...item, enabled } : item)),
                );
              }}
            />
          ),
        },
      ],
      [translate, updateOptions],
    );

    const onDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (!active?.id || !over?.id || active.id === over.id) {
        return;
      }

      const oldIndex = dataSource.findIndex((item) => item.key === active.id);
      const newIndex = dataSource.findIndex((item) => item.key === over.id);
      if (oldIndex < 0 || newIndex < 0) {
        return;
      }

      onChange?.(reorderKanbanGroupOptions(groupOptions, String(active.id), String(over.id)));
    };

    if (!groupFieldName) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={translate('Select a grouping field first')} />;
    }

    return (
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: optionsError ? 8 : 0,
        }}
      >
        {optionsError ? <Alert type="error" message={optionsError} showIcon /> : null}
        <Spin spinning={optionsLoading}>
          <div style={{ width: '100%' }}>
            {dataSource.length ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={dataSource.map((item) => item.key)} strategy={verticalListSortingStrategy}>
                  <Table
                    pagination={false}
                    size="small"
                    rowKey="key"
                    dataSource={dataSource}
                    columns={columns}
                    components={{
                      body: {
                        row: SortableRow,
                      },
                    }}
                  />
                </SortableContext>
              </DndContext>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={translate('No options')} />
            )}
          </div>
        </Spin>
      </div>
    );
  },
);

KanbanGroupOptionsTable.displayName = 'KanbanGroupOptionsTable';
