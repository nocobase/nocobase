/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, HolderOutlined, PlusOutlined } from '@ant-design/icons';
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useFlowEngine } from '@nocobase/flow-engine';
import { useMemoizedFn } from 'ahooks';
import { Button, Form, Radio, Select, Space } from 'antd';
import React, { useMemo } from 'react';
import { useT } from '../../locale';
import { getCollectionFields, type CollectionTriggerField } from './utils';

type SortItem = {
  field?: string;
  direction?: 'asc' | 'desc';
};

type SortableField = {
  value: string;
  label: string;
};

function useSortableFields(collection?: string): SortableField[] {
  const flowEngine = useFlowEngine();
  const t = useT();
  const app = flowEngine.context.app;
  const fields = getCollectionFields(flowEngine.context.dataSourceManager, collection);

  return useMemo(
    () =>
      fields
        .filter((field: CollectionTriggerField) => {
          if (!field.interface) {
            return false;
          }
          const fieldInterface = app?.dataSourceManager?.collectionFieldInterfaceManager?.getFieldInterface?.(
            field.interface,
          );
          return Boolean(fieldInterface?.sortable);
        })
        .map((field) => ({
          value: field.name as string,
          label: field.uiSchema?.title ? t(field.uiSchema.title) : (field.name as string),
        })),
    [app, fields, t],
  );
}

function SortRow({
  id,
  item,
  options,
  onChange,
  onRemove,
}: {
  id: string;
  item: SortItem;
  options: SortableField[];
  onChange: (item: SortItem) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  return (
    <Space
      ref={setNodeRef}
      style={{
        width: '100%',
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      align="start"
    >
      <Button type="text" icon={<HolderOutlined />} {...attributes} {...listeners} />
      <Select
        value={item.field}
        options={options}
        style={{ width: 260 }}
        placeholder=""
        onChange={(field) => onChange({ ...item, field })}
      />
      <Radio.Group
        optionType="button"
        value={item.direction}
        options={[
          { label: 'ASC', value: 'asc' },
          { label: 'DESC', value: 'desc' },
        ]}
        onChange={(event) => onChange({ ...item, direction: event.target.value })}
      />
      <Button type="text" danger icon={<DeleteOutlined />} onClick={onRemove} />
    </Space>
  );
}

export function SortFieldsInput({
  collection,
  value = [],
  onChange,
}: {
  collection?: string;
  value?: SortItem[];
  onChange?: (value: SortItem[]) => void;
}) {
  const t = useT();
  const options = useSortableFields(collection);
  const sensors = useSensors(useSensor(PointerSensor));

  const items = value.map((item, index) => ({
    key: `${item.field ?? 'field'}-${item.direction ?? 'asc'}-${index}`,
    item,
  }));

  const handleAdd = useMemoizedFn(() => {
    onChange?.([...(value ?? []), { field: options[0]?.value, direction: 'asc' }]);
  });

  const handleRemove = useMemoizedFn((index: number) => {
    onChange?.((value ?? []).filter((_, currentIndex) => currentIndex !== index));
  });

  const handleItemChange = useMemoizedFn((index: number, item: SortItem) => {
    const next = [...(value ?? [])];
    next[index] = item;
    onChange?.(next);
  });

  const handleDragEnd = useMemoizedFn((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      return;
    }
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) {
      return;
    }
    const oldIndex = items.findIndex((item) => item.key === activeId);
    const newIndex = items.findIndex((item) => item.key === overId);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }
    onChange?.(arrayMove(value ?? [], oldIndex, newIndex));
  });

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {items.length ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((item) => item.key)} strategy={verticalListSortingStrategy}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {items.map(({ key, item }, index) => (
                <SortRow
                  key={key}
                  id={key}
                  item={item}
                  options={options}
                  onChange={(nextItem) => handleItemChange(index, nextItem)}
                  onRemove={() => handleRemove(index)}
                />
              ))}
            </Space>
          </SortableContext>
        </DndContext>
      ) : null}
      <Button icon={<PlusOutlined />} onClick={handleAdd}>
        {t('Add sort field')}
      </Button>
    </Space>
  );
}

export default SortFieldsInput;
