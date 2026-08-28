/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MenuOutlined } from '@ant-design/icons';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { Badge, Button, Dropdown, Space, Tabs } from 'antd';
import type { TabsProps } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';

/**
 * A category descriptor for {@link SortableCategoryTabs}. The component is
 * i18n-agnostic: `label` is rendered verbatim, so consumers pass an
 * already-compiled/translated node. `color` is an antd preset color name or a
 * hex string; `'default'` / `undefined` renders no badge color.
 */
export type SortableCategoryTabItem = {
  id: string | number;
  label: React.ReactNode;
  color?: string;
};

export type SortableCategoryTabsProps = {
  activeKey: string;
  onChange: (key: string) => void;
  /** Draggable category tabs (the fixed leading tab is configured via `allTab`). */
  categories: SortableCategoryTabItem[];
  /** The fixed, non-draggable leading tab, e.g. "All". */
  allTab: { key: string; label: React.ReactNode };
  /** Show the "+" add button and handle its click. */
  onAdd?: () => void;
  /** Per-category edit menu item handler; menu is hidden when omitted. */
  onEdit?: (id: string | number) => void;
  /** Per-category delete menu item handler; menu is hidden when omitted. */
  onDelete?: (id: string | number) => void;
  /** Reorder handler. Receives the dragged and dropped category ids. */
  onSort?: (sourceId: string | number, targetId: string | number) => void | Promise<void>;
  /** Consumer-translated labels for the per-category dropdown menu. */
  menuLabels?: { edit?: string; delete?: string };
  className?: string;
};

function DraggableTab(props: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: props.id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      {props.children}
    </div>
  );
}

function DroppableTab(props: { id: string; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id: props.id });
  return (
    <div ref={setNodeRef} style={isOver ? { color: 'green' } : undefined}>
      {props.children}
    </div>
  );
}

function CategoryTabContent(props: {
  item: SortableCategoryTabItem;
  onEdit?: (id: string | number) => void;
  onDelete?: (id: string | number) => void;
  menuLabels?: { edit?: string; delete?: string };
}) {
  const { item, onEdit, onDelete, menuLabels } = props;
  const hasMenu = Boolean(onEdit || onDelete);
  const editLabel = menuLabels?.edit ?? 'Edit';
  const deleteLabel = menuLabels?.delete ?? 'Delete';

  return (
    <Space size={6}>
      <Badge color={item.color === 'default' ? undefined : item.color} />
      {item.label}
      {hasMenu ? (
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              onEdit ? { key: 'edit', label: editLabel } : null,
              onDelete ? { key: 'delete', label: deleteLabel } : null,
            ].filter(Boolean) as { key: string; label: string }[],
            onClick({ key, domEvent }) {
              domEvent.stopPropagation();
              if (key === 'edit') {
                onEdit?.(item.id);
                return;
              }
              onDelete?.(item.id);
            },
          }}
        >
          <Button
            aria-label={editLabel}
            icon={<MenuOutlined />}
            size="small"
            type="text"
            onClick={(event) => event.stopPropagation()}
          />
        </Dropdown>
      ) : null}
    </Space>
  );
}

/**
 * A draggable, editable category tab bar. Renders only the tab bar (no content
 * panes) — the page renders its content below and reacts to `activeKey`.
 *
 * Shared by settings pages that group records under reorderable categories
 * (data-source collections, workflows, …). Drag-to-reorder is powered by
 * `@dnd-kit`; the "+" / per-tab edit-delete affordances are optional.
 */
export function SortableCategoryTabs(props: SortableCategoryTabsProps) {
  const { activeKey, onChange, categories, allTab, onAdd, onEdit, onDelete, onSort, menuLabels, className } = props;
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 10 } }));

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveDragId(null);
      if (!over || over.id === active.id) {
        return;
      }
      await onSort?.(active.id as string | number, over.id as string | number);
    },
    [onSort],
  );

  const items = useMemo<TabsProps['items']>(
    () => [
      { key: allTab.key, label: allTab.label, closable: false },
      ...categories.map((item) => ({
        key: String(item.id),
        closable: false,
        label: onSort ? (
          <DroppableTab id={String(item.id)}>
            <DraggableTab id={String(item.id)}>
              <CategoryTabContent item={item} onEdit={onEdit} onDelete={onDelete} menuLabels={menuLabels} />
            </DraggableTab>
          </DroppableTab>
        ) : (
          <CategoryTabContent item={item} onEdit={onEdit} onDelete={onDelete} menuLabels={menuLabels} />
        ),
      })),
    ],
    [allTab.key, allTab.label, categories, onSort, onEdit, onDelete, menuLabels],
  );

  const activeDragItem = useMemo(
    () => categories.find((item) => String(item.id) === activeDragId),
    [categories, activeDragId],
  );

  const tabs = (
    <Tabs
      className={className}
      activeKey={activeKey}
      type="editable-card"
      hideAdd={!onAdd}
      items={items}
      onChange={onChange}
      onEdit={(_, action) => {
        if (action === 'add') {
          onAdd?.();
        }
      }}
    />
  );

  if (!onSort) {
    return tabs;
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {tabs}
      <DragOverlay dropAnimation={null}>
        {activeDragItem ? (
          <span style={{ whiteSpace: 'nowrap' }}>
            <CategoryTabContent item={activeDragItem} menuLabels={menuLabels} />
          </span>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default SortableCategoryTabs;
