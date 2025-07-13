/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ObjectField as ObjectFieldModel } from '@formily/core';
import { observer, useField, useFieldSchema } from '@formily/react';
import { Switch } from 'antd';
import { MenuOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from '@emotion/css';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { useProps } from '../../hooks/useProps';
import { useCompile } from '../../hooks';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { useSortable, SortableContext } from '@dnd-kit/sortable';

export interface EditTableProps {
  columns?: any[];
  value?: any[];
  onChange?: (value: any[]) => void;
  className?: string;
}

interface ColumnItem {
  key: string;
  title: string;
  dataIndex: string;
  visible: boolean;
  fixed?: 'left' | 'right' | false;
}

interface DraggableItemProps {
  item: ColumnItem;
  index: number;
  onToggleVisible: (key: string, visible: boolean) => void;
}

const containerStyle = css`
  width: 420px;
`;

const itemStyle = css`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  user-select: none;
  background: white;

  &:hover {
    background-color: #fafafa;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const dragHandleStyle = css`
  margin-right: 12px;
  color: #bfbfbf;
  cursor: grab;
  font-size: 14px;

  &:hover {
    color: #8c8c8c;
  }

  &:active {
    cursor: grabbing;
  }
`;

const visibilityIconStyle = css`
  margin-right: 12px;
  font-size: 16px;
`;

const titleStyle = css`
  flex: 1;
  margin-right: 12px;
  font-size: 14px;
  color: #262626;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const switchContainerStyle = css`
  display: flex;
  align-items: center;
`;

const headerStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px 16px;
  border-bottom: 1px solid #f0f0f0;
`;

const headerTitleStyle = css`
  font-size: 14px;
  font-weight: 500;
  color: #262626;
  margin: 0;
`;

const headerStatsStyle = css`
  font-size: 12px;
  color: #8c8c8c;
`;

const mainContainerStyle = css`
  background: white;
  margin-bottom: 16px;
`;

const emptyStyle = css`
  padding: 40px 20px;
  text-align: center;
  color: #8c8c8c;
  border-top: 1px solid #f0f0f0;
`;

const DraggableItem: React.FC<DraggableItemProps> = ({ item, index, onToggleVisible }) => {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.key });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} className={itemStyle} style={style} {...attributes}>
      <MenuOutlined className={dragHandleStyle} {...listeners} />
      <div className={visibilityIconStyle}>{item.visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}</div>
      <span className={titleStyle}>{item.title}</span>
      <div className={switchContainerStyle}>
        <Switch size="small" checked={item.visible} onChange={(checked) => onToggleVisible(item.key, checked)} />
      </div>
    </div>
  );
};

const InternalEditTable = observer((props: EditTableProps) => {
  const field = useField<ObjectFieldModel>();
  const fieldSchema = useFieldSchema();
  const compile = useCompile();
  const { t } = useTranslation();

  // Get props through useProps for compatibility
  const { columns: propsColumns, value, onChange } = useProps(props);

  // Convert schema columns to internal format
  const parseColumns = useCallback(
    (schemaColumns: any[]): ColumnItem[] => {
      if (!schemaColumns || !Array.isArray(schemaColumns)) {
        return [];
      }

      // Check if data is already in ColumnInfo format
      if (
        schemaColumns.length > 0 &&
        Object.prototype.hasOwnProperty.call(schemaColumns[0], 'key') &&
        Object.prototype.hasOwnProperty.call(schemaColumns[0], 'visible')
      ) {
        return schemaColumns as ColumnItem[];
      }

      // Convert from schema format to ColumnInfo format
      return schemaColumns.map((col, index) => ({
        key: col['x-uid'] || col.name || `column-${index}`,
        title: compile(col.title) || col.name || `Column ${index + 1}`,
        dataIndex: col.name || col.dataIndex || `column-${index}`,
        visible: col['x-display'] !== 'hidden' && col.visible !== false,
        fixed: col.fixed || false,
      }));
    },
    [compile],
  );

  // Initialize columns from props or field dataSource
  const [columns, setColumns] = useState<ColumnItem[]>(() => {
    const sourceColumns = propsColumns || field.dataSource || [];
    return parseColumns(sourceColumns);
  });

  // Update columns when external data changes
  useEffect(() => {
    const sourceColumns = propsColumns || field.dataSource || [];

    // Only update if we actually have source data and current columns is empty
    if (sourceColumns.length > 0 && columns.length === 0) {
      const newColumns = parseColumns(sourceColumns);
      setColumns(newColumns);
    }
  }, [propsColumns, field.dataSource, parseColumns, columns.length]);

  // Sync with form field value
  useEffect(() => {
    if (value && Array.isArray(value)) {
      const newColumns = parseColumns(value);
      setColumns(newColumns);
    }
  }, [value, parseColumns]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (active.id !== over?.id) {
        setColumns((prevColumns) => {
          const oldIndex = prevColumns.findIndex((item) => item.key === active.id);
          const newIndex = prevColumns.findIndex((item) => item.key === over?.id);

          if (oldIndex !== -1 && newIndex !== -1) {
            const newColumns = [...prevColumns];
            const [removed] = newColumns.splice(oldIndex, 1);
            newColumns.splice(newIndex, 0, removed);

            // Notify form of changes
            onChange?.(newColumns);
            return newColumns;
          }

          return prevColumns;
        });
      }
    },
    [onChange],
  );

  const onToggleVisible = useCallback(
    (key: string, visible: boolean) => {
      setColumns((prevColumns) => {
        const newColumns = prevColumns.map((col) => (col.key === key ? { ...col, visible } : col));

        // Notify form of changes
        onChange?.(newColumns);
        return newColumns;
      });
    },
    [onChange],
  );

  // Calculate stats for header
  const visibleCount = columns.filter((col) => col.visible).length;
  const totalCount = columns.length;

  if (columns.length === 0) {
    return (
      <div className={mainContainerStyle}>
        <div className={headerStyle}>
          <h4 className={headerTitleStyle}>{t('Table Columns')}</h4>
        </div>
        <div className={emptyStyle}>
          <EyeInvisibleOutlined style={{ fontSize: '24px', marginBottom: '8px', display: 'block' }} />
          {t('No columns available')}
        </div>
      </div>
    );
  }

  return (
    <div className={mainContainerStyle}>
      <div className={headerStyle}>
        <h4 className={headerTitleStyle}>{t('Table Columns')}</h4>
        <span className={headerStatsStyle}>
          {visibleCount}/{totalCount} {t('visible')}
        </span>
      </div>
      <div className={containerStyle}>
        <DndContext onDragEnd={handleDragEnd}>
          <SortableContext items={columns.map((item) => item.key)}>
            {columns.map((item, index) => (
              <DraggableItem key={item.key} index={index} item={item} onToggleVisible={onToggleVisible} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
});

export const EditTable: any = withDynamicSchemaProps(InternalEditTable, { displayName: 'EditTable' });
