/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DragOutlined } from '@ant-design/icons';
import type { Modifier } from '@dnd-kit/core';
import { DndContext, DndContextProps, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import type { Transform } from '@dnd-kit/utilities';
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FlowModel } from '../../models';
import { useFlowEngine } from '../../provider';
import { PersistOptions } from '../../types';

export * from './findModelUidPosition';
export * from './gridDragPlanner';

export const EMPTY_COLUMN_UID = 'EMPTY_COLUMN';
export const TOOLBAR_DRAG_ACTIVITY_EVENT = 'nb-toolbar-drag-activity';
const TOOLBAR_DRAG_ANCHOR_EVENT = 'nb-toolbar-drag-anchor';
const MENU_SUBMENU_POPUP_SELECTOR = '.ant-menu-submenu-popup';

type ToolbarDragAnchorPoint = {
  x: number;
  y: number;
};

type ToolbarDragAnchorDetail = {
  modelUid: string;
  point: ToolbarDragAnchorPoint | null;
};

export const resolveOverlayAnchorTransform = ({
  activeId,
  active,
  transform,
  activeNodeRect,
  dragAnchorPoint,
}: {
  activeId: string | null;
  active: { id: string | number } | null | undefined;
  transform: Transform;
  activeNodeRect: { top: number; left: number } | null;
  dragAnchorPoint: ToolbarDragAnchorPoint | null;
}): Transform => {
  if (!activeId || active?.id !== activeId || !dragAnchorPoint || !activeNodeRect) {
    return transform;
  }

  return {
    ...transform,
    x: transform.x + dragAnchorPoint.x - activeNodeRect.left,
    y: transform.y + dragAnchorPoint.y - activeNodeRect.top,
  };
};

const resolveDraggableHostNode = (activatorNode: HTMLElement | null) => {
  const ownerDocument = activatorNode?.ownerDocument;
  const floatToolbarContainer = activatorNode?.closest<HTMLElement>('.nb-toolbar-container[data-model-uid]');
  const toolbarModelUid = floatToolbarContainer?.getAttribute('data-model-uid');

  if (!ownerDocument || !toolbarModelUid) {
    return activatorNode;
  }

  const matchedHosts = Array.from(
    ownerDocument.querySelectorAll<HTMLElement>(
      `[data-has-float-menu="true"][data-float-menu-model-uid="${toolbarModelUid}"]`,
    ),
  );
  const popupRoot = floatToolbarContainer.closest<HTMLElement>(MENU_SUBMENU_POPUP_SELECTOR);

  if (popupRoot) {
    return (
      matchedHosts.find((hostNode) => hostNode.closest(MENU_SUBMENU_POPUP_SELECTOR) === popupRoot) || activatorNode
    );
  }

  return (
    matchedHosts.find((hostNode) => !hostNode.closest(MENU_SUBMENU_POPUP_SELECTOR)) || matchedHosts[0] || activatorNode
  );
};

// 可拖拽图标组件
export const DragHandler: FC<{ model: FlowModel; children?: React.ReactNode }> = ({
  model,
  children = <DragOutlined />,
}) => {
  const { attributes, isDragging, listeners, setActivatorNodeRef, setNodeRef } = useDraggable({ id: model.uid });
  const dragHandlerRef = useRef<HTMLSpanElement | null>(null);
  const draggableNodeRef = useRef<HTMLElement | null>(null);
  const pointerPressCleanupRef = useRef<(() => void) | null>(null);
  const isDraggingRef = useRef(isDragging);
  const isPointerPressActiveRef = useRef(false);
  const isToolbarDragActiveRef = useRef(false);
  const syncDraggableNodeRef = useCallback(
    (activatorNode: HTMLElement | null) => {
      const nextNode = resolveDraggableHostNode(activatorNode);

      if (draggableNodeRef.current === nextNode) {
        return;
      }

      draggableNodeRef.current = nextNode;
      setNodeRef(nextNode);
    },
    [setNodeRef],
  );
  const setDragHandlerNodeRef = useCallback(
    (node: HTMLSpanElement | null) => {
      dragHandlerRef.current = node;
      setActivatorNodeRef(node);
      syncDraggableNodeRef(node);
    },
    [setActivatorNodeRef, syncDraggableNodeRef],
  );
  const dispatchToolbarDragActivity = useCallback(
    (active: boolean) => {
      const ownerDocument = dragHandlerRef.current?.ownerDocument;
      if (!ownerDocument) {
        return;
      }

      ownerDocument.dispatchEvent(
        new CustomEvent(TOOLBAR_DRAG_ACTIVITY_EVENT, {
          detail: { active, modelUid: model.uid },
        }),
      );
    },
    [model.uid],
  );

  const dispatchToolbarDragAnchor = useCallback(
    (detail: Pick<ToolbarDragAnchorDetail, 'point'>) => {
      const ownerDocument = dragHandlerRef.current?.ownerDocument;
      if (!ownerDocument) {
        return;
      }

      ownerDocument.dispatchEvent(
        new CustomEvent<ToolbarDragAnchorDetail>(TOOLBAR_DRAG_ANCHOR_EVENT, {
          detail: { modelUid: model.uid, point: detail.point },
        }),
      );
    },
    [model.uid],
  );

  const clearPointerPressListeners = useCallback(() => {
    pointerPressCleanupRef.current?.();
    pointerPressCleanupRef.current = null;
  }, []);

  const syncToolbarDragActivity = useCallback(() => {
    const nextActive = isPointerPressActiveRef.current || isDraggingRef.current;
    if (nextActive === isToolbarDragActiveRef.current) {
      return;
    }

    isToolbarDragActiveRef.current = nextActive;
    dispatchToolbarDragActivity(nextActive);
  }, [dispatchToolbarDragActivity]);

  const handlePointerPressEnd = useCallback(() => {
    isPointerPressActiveRef.current = false;
    clearPointerPressListeners();
    syncToolbarDragActivity();
  }, [clearPointerPressListeners, syncToolbarDragActivity]);

  const registerPointerPressListeners = useCallback(() => {
    const ownerDocument = dragHandlerRef.current?.ownerDocument;
    const ownerWindow = ownerDocument?.defaultView;
    if (!ownerDocument) {
      return;
    }

    clearPointerPressListeners();

    const handlePointerEnd = () => {
      handlePointerPressEnd();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handlePointerPressEnd();
      }
    };

    ownerDocument.addEventListener('pointerup', handlePointerEnd, true);
    ownerDocument.addEventListener('pointercancel', handlePointerEnd, true);
    ownerDocument.addEventListener('keydown', handleKeyDown, true);
    ownerWindow?.addEventListener('blur', handlePointerEnd);

    pointerPressCleanupRef.current = () => {
      ownerDocument.removeEventListener('pointerup', handlePointerEnd, true);
      ownerDocument.removeEventListener('pointercancel', handlePointerEnd, true);
      ownerDocument.removeEventListener('keydown', handleKeyDown, true);
      ownerWindow?.removeEventListener('blur', handlePointerEnd);
    };
  }, [clearPointerPressListeners, handlePointerPressEnd]);

  useEffect(() => {
    syncDraggableNodeRef(dragHandlerRef.current);
  }, [syncDraggableNodeRef]);

  useEffect(() => {
    isDraggingRef.current = isDragging;
    syncToolbarDragActivity();
  }, [isDragging, syncToolbarDragActivity]);

  useEffect(() => {
    return () => {
      if (isToolbarDragActiveRef.current) {
        dispatchToolbarDragActivity(false);
      }
      isPointerPressActiveRef.current = false;
      isDraggingRef.current = false;
      isToolbarDragActiveRef.current = false;
      clearPointerPressListeners();
    };
  }, [clearPointerPressListeners, dispatchToolbarDragActivity]);

  return (
    <span
      ref={setDragHandlerNodeRef}
      {...listeners}
      {...attributes}
      onPointerDownCapture={(event) => {
        if (event.button !== 0) {
          return;
        }

        dispatchToolbarDragAnchor({
          point: {
            x: event.clientX,
            y: event.clientY,
          },
        });
        isPointerPressActiveRef.current = true;
        syncToolbarDragActivity();
        registerPointerPressListeners();
      }}
      style={{
        cursor: 'grab',
      }}
    >
      {children}
    </span>
  );
};

// 通用 Droppable 组件
export const Droppable: FC<{ model: FlowModel<any>; children: React.ReactNode }> = ({ model, children }) => {
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
  const [dragAnchorPoint, setDragAnchorPoint] = useState<ToolbarDragAnchorDetail['point']>(null);
  const flowEngine = useFlowEngine();

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const handleToolbarDragAnchor = (event: Event) => {
      const customEvent = event as CustomEvent<ToolbarDragAnchorDetail>;
      setDragAnchorPoint(customEvent.detail?.point || null);
    };

    document.addEventListener(TOOLBAR_DRAG_ANCHOR_EVENT, handleToolbarDragAnchor as EventListener);
    return () => {
      document.removeEventListener(TOOLBAR_DRAG_ANCHOR_EVENT, handleToolbarDragAnchor as EventListener);
    };
  }, []);

  const overlayAnchorModifier = useCallback<Modifier>(
    ({ active, activeNodeRect, transform }) => {
      const nextTransform: Transform = resolveOverlayAnchorTransform({
        activeId,
        active,
        transform,
        activeNodeRect,
        dragAnchorPoint,
      });

      return nextTransform;
    },
    [activeId, dragAnchorPoint],
  );

  return (
    <DndContext
      onDragStart={(event) => {
        setActiveId(event.active.id as string);
        restProps.onDragStart?.(event);
      }}
      onDragEnd={(event) => {
        setActiveId(null);
        setDragAnchorPoint(null);
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
      onDragCancel={(event) => {
        setActiveId(null);
        setDragAnchorPoint(null);
        restProps.onDragCancel?.(event);
      }}
      {...restProps}
    >
      {children}
      {typeof document !== 'undefined'
        ? createPortal(
            <DragOverlay
              dropAnimation={null}
              modifiers={[overlayAnchorModifier]}
              zIndex={2000}
              style={{ pointerEvents: 'none' }}
            >
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
                    pointerEvents: 'none',
                    // fontSize: 18,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}
                >
                  {flowEngine.translate('Dragging')}
                </span>
              )}
            </DragOverlay>,
            document.body,
          )
        : null}
    </DndContext>
  );
};
