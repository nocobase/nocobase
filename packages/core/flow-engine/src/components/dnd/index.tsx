/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DragOutlined } from '@ant-design/icons';
import { DndContext, DndContextProps, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import React, { FC, useState } from 'react';
import { createPortal } from 'react-dom';
import { FlowModel } from '../../models';
import { useFlowEngine } from '../../provider';
import { PersistOptions } from '../../types';

export * from './getMousePositionOnElement';
export * from './moveBlock';

export const EMPTY_COLUMN_UID = 'EMPTY_COLUMN';

// 可拖拽图标组件
export const DragHandler: FC<{ model: FlowModel; children: React.ReactNode }> = ({
  model,
  children = <DragOutlined />,
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: model.uid });
  return (
    <span
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        cursor: 'grab',
      }}
    >
      {children}
    </span>
  );
};

// 通用 Droppable 组件
export const Droppable: FC<{ model: FlowModel; children: React.ReactNode }> = ({ model, children }) => {
  const { setNodeRef, isOver, active } = useDroppable({ id: model.uid });
  const isActiveDroppable = active?.id === model.uid;
  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'relative',
        opacity: isActiveDroppable ? 0.3 : 1,
        outline: isActiveDroppable ? '2px solid var(--colorBorderSettingsHover)' : 'none',
        borderRadius: isActiveDroppable ? model.context.themeToken.borderRadiusLG : 'none',
      }}
    >
      {children}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: isOver ? 'var(--colorBgSettingsHover)' : 'transparent',
          pointerEvents: 'none',
        }}
      ></div>
    </div>
  );
};

// 提供一个封装了 DragOverlay 的 DndProvider 组件，继承 DndContext 的所有 props
export const DndProvider: FC<DndContextProps & PersistOptions> = ({
  persist = true,
  children,
  onDragEnd,
  ...restProps
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const flowEngine = useFlowEngine();
  return (
    <DndContext
      onDragStart={(event) => {
        setActiveId(event.active.id as string);
        restProps.onDragStart?.(event);
      }}
      onDragEnd={(event) => {
        setActiveId(null);
        // 如果没有 onDragEnd 回调，则默认调用 flowEngine 的 moveModel 方法
        if (!onDragEnd) {
          if (event.over) {
            flowEngine.moveModel(event.active.id, event.over.id, { persist });
          }
        } else {
          // 如果有 onDragEnd 回调，则调用它
          onDragEnd(event);
        }
      }}
      {...restProps}
    >
      {children}
      {createPortal(
        <DragOverlay dropAnimation={null} zIndex={2000}>
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
              }}
            >
              {flowEngine.translate('Dragging')}
            </span>
          )}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  );
};
