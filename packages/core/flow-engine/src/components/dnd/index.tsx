/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DragOutlined } from '@ant-design/icons';
import { DndContext, DndContextProps, DragEndEvent, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import React, { useState } from 'react';

// 可拖拽图标组件
export function DragHandler({ id }: { id: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return (
    <span
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        marginRight: 8,
        color: '#1890ff',
        fontSize: 18,
        verticalAlign: 'middle',
      }}
    >
      <DragOutlined />
    </span>
  );
}

// 通用 Droppable 组件
export function Droppable({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        background: isOver ? '#e6f7ff' : '#f9f9f9',
        borderRadius: 4,
        transition: 'all 0.2s',
        marginBottom: 8,
        padding: 8,
      }}
    >
      {children}
    </div>
  );
}

// 提供一个封装了 DragOverlay 的 DndProvider 组件，继承 DndContext 的所有 props
export function DndProvider({ children, ...restProps }: DndContextProps & { children: React.ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  console.log('DndProvider activeId:', activeId);

  return (
    <DndContext
      onDragStart={(event) => {
        setActiveId(event.active.id as string);
        restProps.onDragStart?.(event);
      }}
      onDragEnd={(event) => {
        setActiveId(null);
        restProps.onDragEnd?.(event);
      }}
      {...restProps}
    >
      {children}
      <DragOverlay>
        {activeId && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
              background: '#fff',
              border: '1px solid #1890ff',
              borderRadius: 4,
              padding: '4px 12px',
              color: '#1890ff',
              // fontSize: 18,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              minWidth: 120,
            }}
          >
            拖拽中: {activeId}
          </span>
        )}
      </DragOverlay>
    </DndContext>
  );
}
