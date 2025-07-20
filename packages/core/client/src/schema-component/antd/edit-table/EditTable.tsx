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
import { Switch, Button, Space, Tooltip, Checkbox } from 'antd';
import {
  MenuOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignBottomOutlined,
  VerticalAlignMiddleOutlined,
} from '@ant-design/icons';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from '@emotion/css';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { useProps } from '../../hooks/useProps';
import { useCompile } from '../../hooks';
import { useToken } from '../../../style';
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
  onToggleFixed: (key: string, fixed: 'left' | 'right' | false) => void;
}

const createContainerStyle = (token: any) => css`
  max-height: 100%;
  overflow-y: auto;
`;

const createItemStyle = (token: any) => css`
  display: flex;
  align-items: center;
  padding: ${token.padding}px ${token.paddingLG}px;
  border-top: 1px solid ${token.colorBorderSecondary};
  user-select: none;
  background: ${token.colorBgContainer};

  &:hover {
    background-color: ${token.colorFillTertiary};
  }
`;

const createDragHandleStyle = (token: any) => css`
  margin-right: ${token.margin}px;
  color: ${token.colorTextDescription};
  cursor: grab;
  font-size: ${token.fontSize}px;

  &:hover {
    color: ${token.colorTextSecondary};
  }

  &:active {
    cursor: grabbing;
  }
`;

const createVisibilityIconStyle = (token: any) => css`
  margin-right: ${token.margin}px;
  font-size: ${token.fontSizeLG}px;
`;

const createTitleStyle = (token: any) => css`
  flex: 1;
  margin-right: ${token.margin}px;
  font-size: ${token.fontSize}px;
  color: ${token.colorText};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const createCheckboxContainerStyle = () => css`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const createItemCheckboxStyle = (token: any) => css`
  margin-right: ${token.margin}px;
`;

const createSectionHeaderStyle = (token: any) => css`
  padding: ${token.padding}px ${token.paddingLG}px;
  background: ${token.colorFillTertiary};
  font-weight: ${token.fontWeightStrong};
  color: ${token.colorTextSecondary};
  font-size: ${token.fontSizeSM}px;
  border-bottom: 1px solid ${token.colorBorderSecondary};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const createSectionCheckboxStyle = (token: any) => css`
  margin-left: auto;
`;

const createSectionStyle = (token: any) => css`
  border-bottom: 1px solid ${token.colorBorderSecondary};

  &:last-child {
    border-bottom: none;
  }
`;

const createPinButtonStyle = (token: any) => css`
  color: ${token.colorTextDescription};
  border: none;
  padding: 4px;
  height: auto;

  &:hover {
    color: ${token.colorPrimary};
    background: ${token.colorFillTertiary};
  }
`;

const createActionButtonStyle = (token: any) => css`
  color: ${token.colorTextDescription};
  border: none;
  padding: 4px;
  height: auto;
  margin-left: 4px;

  &:hover {
    color: ${token.colorPrimary};
    background: ${token.colorFillTertiary};
  }
`;

const createMainContainerStyle = (token: any) => css`
  background: ${token.colorBgContainer};
`;

const createEmptyStyle = (token: any) => css`
  padding: ${token.paddingLG * 2}px ${token.paddingLG}px;
  text-align: center;
  color: ${token.colorTextDescription};
  border-top: 1px solid ${token.colorBorderSecondary};
`;

const DraggableItem: React.FC<DraggableItemProps> = ({ item, index, onToggleVisible, onToggleFixed }) => {
  const { t } = useTranslation();
  const { token } = useToken();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.key });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handlePinToTop = () => {
    onToggleFixed(item.key, 'left');
  };

  const handlePinToBottom = () => {
    onToggleFixed(item.key, 'right');
  };

  const handleUnpin = () => {
    onToggleFixed(item.key, false);
  };

  const getUnpinIcon = () => {
    return <VerticalAlignMiddleOutlined />;
  };

  return (
    <div ref={setNodeRef} className={createItemStyle(token)} style={style} {...attributes}>
      <Checkbox
        checked={item.visible}
        onChange={(e) => {
          onToggleVisible(item.key, e.target.checked);
        }}
        className={createItemCheckboxStyle(token)}
      />
      <MenuOutlined className={createDragHandleStyle(token)} {...listeners} />
      <div className={createVisibilityIconStyle(token)}>
        {item.visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
      </div>
      <span className={createTitleStyle(token)}>{item.title}</span>
      <div className={createCheckboxContainerStyle()}>
        {item.fixed === 'left' ? (
          <>
            <Tooltip title={t('Pin to right')}>
              <Button
                type="text"
                size="small"
                icon={<VerticalAlignBottomOutlined />}
                onClick={handlePinToBottom}
                className={createActionButtonStyle(token)}
              />
            </Tooltip>
            <Tooltip title={t('Unpinned')}>
              <Button
                type="text"
                size="small"
                icon={getUnpinIcon()}
                onClick={handleUnpin}
                className={createPinButtonStyle(token)}
              />
            </Tooltip>
          </>
        ) : item.fixed === 'right' ? (
          <>
            <Tooltip title={t('Pin to left')}>
              <Button
                type="text"
                size="small"
                icon={<VerticalAlignTopOutlined />}
                onClick={handlePinToTop}
                className={createActionButtonStyle(token)}
              />
            </Tooltip>
            <Tooltip title={t('Unpinned')}>
              <Button
                type="text"
                size="small"
                icon={getUnpinIcon()}
                onClick={handleUnpin}
                className={createPinButtonStyle(token)}
              />
            </Tooltip>
          </>
        ) : (
          <>
            <Tooltip title={t('Pin to left')}>
              <Button
                type="text"
                size="small"
                icon={<VerticalAlignTopOutlined />}
                onClick={handlePinToTop}
                className={createActionButtonStyle(token)}
              />
            </Tooltip>
            <Tooltip title={t('Pin to right')}>
              <Button
                type="text"
                size="small"
                icon={<VerticalAlignBottomOutlined />}
                onClick={handlePinToBottom}
                className={createActionButtonStyle(token)}
              />
            </Tooltip>
          </>
        )}
      </div>
    </div>
  );
};

const InternalEditTable = observer((props: EditTableProps) => {
  const field = useField<ObjectFieldModel>();
  const fieldSchema = useFieldSchema();
  const compile = useCompile();
  const { t } = useTranslation();
  const { token } = useToken();

  // Get props through useProps for compatibility
  const { columns: propsColumns, value, onChange } = useProps(props);

  // Get columns from schema x-component-props first, then fallback to other sources
  const schemaColumns = fieldSchema?.['x-component-props']?.columns;

  // Convert schema columns to internal format
  const parseColumns = useMemo(() => {
    return (schemaColumns: any[]): ColumnItem[] => {
      if (!schemaColumns || !Array.isArray(schemaColumns)) {
        return [];
      }

      // Check if data is already in ColumnInfo format
      if (
        schemaColumns.length > 0 &&
        Object.prototype.hasOwnProperty.call(schemaColumns[0], 'key') &&
        Object.prototype.hasOwnProperty.call(schemaColumns[0], 'visible')
      ) {
        // Even if data is in ColumnInfo format, we need to ensure all required properties are present
        return schemaColumns.map((col, index) => ({
          key: col.key || col['x-uid'] || col.name || `column-${index}`,
          title: col.title || compile(col.title) || col.name || `Column ${index + 1}`,
          dataIndex: col.dataIndex || col.name || `column-${index}`,
          visible: col.visible !== undefined ? col.visible : col['x-display'] !== 'hidden' && col.visible !== false,
          fixed: col.fixed || false,
        })) as ColumnItem[];
      }

      // Convert from schema format to ColumnInfo format
      return schemaColumns.map((col, index) => ({
        key: col['x-uid'] || col.name || `column-${index}`,
        title: compile(col.title) || col.name || `Column ${index + 1}`,
        dataIndex: col.name || col.dataIndex || `column-${index}`,
        visible: col['x-display'] !== 'hidden' && col.visible !== false,
        fixed: col.fixed || false,
      }));
    };
  }, [compile]);

  // Initialize columns from schema x-component-props first, then fallback to other sources
  const [columns, setColumns] = useState<ColumnItem[]>(() => {
    const sourceColumns = schemaColumns || propsColumns || field.dataSource || [];
    return parseColumns(sourceColumns);
  });

  // Update columns when external data changes - prioritize schema x-component-props.columns
  useEffect(() => {
    // Priority order: schema x-component-props.columns > value > propsColumns > field.dataSource
    let sourceColumns = null;

    if (schemaColumns && schemaColumns.length > 0) {
      sourceColumns = schemaColumns;
    } else if (value && Array.isArray(value) && value.length > 0) {
      sourceColumns = value;
    } else if (propsColumns && propsColumns.length > 0) {
      sourceColumns = propsColumns;
    } else if (field.dataSource && field.dataSource.length > 0) {
      sourceColumns = field.dataSource;
    }

    // Update when source data changes
    if (sourceColumns && sourceColumns.length > 0) {
      const newColumns = parseColumns(sourceColumns);
      setColumns(newColumns);
    }
  }, [schemaColumns, value, propsColumns, field.dataSource]);

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

  const onToggleFixed = useCallback(
    (key: string, fixed: 'left' | 'right' | false) => {
      setColumns((prevColumns) => {
        const newColumns = prevColumns.map((col) => (col.key === key ? { ...col, fixed } : col));

        // Notify form of changes
        onChange?.(newColumns);
        return newColumns;
      });
    },
    [onChange],
  );

  // Group columns by fixed status
  const groupedColumns = useMemo(() => {
    const leftFixed = columns.filter((col) => col.fixed === 'left');
    const notFixed = columns.filter((col) => !col.fixed);
    const rightFixed = columns.filter((col) => col.fixed === 'right');

    return { leftFixed, notFixed, rightFixed };
  }, [columns]);

  if (columns.length === 0) {
    return (
      <div className={createMainContainerStyle(token)}>
        <div className={createEmptyStyle(token)}>
          <EyeInvisibleOutlined
            style={{ fontSize: `${token.fontSizeXL}px`, marginBottom: `${token.marginXS}px`, display: 'block' }}
          />
          {t('No columns available')}
        </div>
      </div>
    );
  }

  const renderColumnSection = (sectionColumns: ColumnItem[], sectionTitle: string) => {
    if (sectionColumns.length === 0) return null;

    const visibleCount = sectionColumns.filter((col) => col.visible).length;
    const totalCount = sectionColumns.length;
    const isAllChecked = visibleCount === totalCount;
    const isIndeterminate = visibleCount > 0 && visibleCount < totalCount;

    const handleSectionCheckAll = (checked: boolean) => {
      sectionColumns.forEach((col) => {
        onToggleVisible(col.key, checked);
      });
    };

    return (
      <div className={createSectionStyle(token)}>
        <div className={createSectionHeaderStyle(token)}>
          <span>{sectionTitle}</span>
          <Checkbox
            checked={isAllChecked}
            indeterminate={isIndeterminate}
            onChange={(e) => handleSectionCheckAll(e.target.checked)}
            className={createSectionCheckboxStyle(token)}
          />
        </div>
        <DndContext onDragEnd={handleDragEnd}>
          <SortableContext items={sectionColumns.map((item) => item.key)}>
            {sectionColumns.map((item, index) => (
              <DraggableItem
                key={item.key}
                index={index}
                item={item}
                onToggleVisible={onToggleVisible}
                onToggleFixed={onToggleFixed}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    );
  };

  return (
    <div className={createMainContainerStyle(token)}>
      <div className={createContainerStyle(token)}>
        {renderColumnSection(groupedColumns.leftFixed, t('Fixed to the left'))}
        {renderColumnSection(groupedColumns.notFixed, t('Not Fixed'))}
        {renderColumnSection(groupedColumns.rightFixed, t('Fixed to the right'))}
      </div>
    </div>
  );
});

export const EditTable: any = withDynamicSchemaProps(InternalEditTable, { displayName: 'EditTable' });
