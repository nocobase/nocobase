/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useCallback, useRef, useEffect, useMemo, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Alert, Space } from 'antd';
import { css } from '@emotion/css';
import { FlowModel } from '../../../../models';
import { ToolbarItemConfig } from '../../../../types';
import { useFlowModelById } from '../../../../hooks';
import { useFlowEngine } from '../../../../provider';
import { FlowEngine } from '../../../../flowEngine';
import { getT } from '../../../../utils';
import { useFlowContext } from '../../../..';
import { observer } from '../../../../reactive';

const TOOLBAR_Z_INDEX = 999;
const TOOLBAR_HIDE_DELAY = 180;
const APP_CONTAINER_SELECTOR = '#nocobase-app-container';
const CHILD_FLOAT_MENU_ACTIVITY_EVENT = 'nb-float-menu-child-activity';
const DRAWER_CONTENT_WRAPPER_SELECTOR = '.ant-drawer-content-wrapper';
const DRAWER_CONTENT_SELECTOR = '.ant-drawer-content';
const DRAWER_ROOT_SELECTOR = '.ant-drawer-root';
const MODAL_CONTENT_SELECTOR = '.ant-modal-content';
const MODAL_SELECTOR = '.ant-modal';
const MODAL_WRAP_SELECTOR = '.ant-modal-wrap';
const MODAL_ROOT_SELECTOR = '.ant-modal-root';

type ToolbarPosition = 'inside' | 'above' | 'below';
type ToolbarPortalPositioningMode = 'fixed' | 'absolute';

interface ToolbarPortalHostConfig {
  mountElement: HTMLElement;
  positioningElement: HTMLElement;
  positioningMode: ToolbarPortalPositioningMode;
}

interface ToolbarPortalRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface ToolbarPortalInset {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

const hostContainerStyles = css`
  position: relative;

  &.has-button-child {
    display: inline-block;
  }
`;

const toolbarPositionClassNames: Record<ToolbarPosition, string> = {
  inside: 'nb-toolbar-position-inside',
  above: 'nb-toolbar-position-above',
  below: 'nb-toolbar-position-below',
};

const toolbarContainerStyles = ({
  showBackground,
  showBorder,
  ctx,
}: {
  showBackground: boolean;
  showBorder: boolean;
  ctx: any;
}) => css`
  z-index: ${TOOLBAR_Z_INDEX};
  opacity: 0;
  pointer-events: none;
  overflow: visible;
  transition: opacity 0.12s ease;
  background: ${showBackground ? 'var(--colorBgSettingsHover)' : 'transparent'};
  border: ${showBorder ? '2px solid var(--colorBorderSettingsHover)' : 'none'};
  border-radius: ${ctx.themeToken.borderRadiusLG}px;

  &.nb-toolbar-visible {
    opacity: 1;
    transition-delay: 0.1s;
  }

  &.nb-toolbar-portal {
    top: 0;
    left: 0;
  }

  &.nb-toolbar-portal-fixed {
    position: fixed;
  }

  &.nb-toolbar-portal-absolute {
    position: absolute;
  }

  &.nb-in-template {
    background: var(--colorTemplateBgSettingsHover);
  }

  > .nb-toolbar-container-title {
    pointer-events: none;
    position: absolute;
    top: 2px;
    left: 2px;
    display: flex;
    align-items: center;
    gap: 4px;
    height: 16px;
    padding: 0;
    font-size: 12px;
    line-height: 16px;
    border-bottom-right-radius: 2px;
    border-radius: 2px;

    .title-tag {
      display: inline-flex;
      padding: 0 3px;
      border-radius: 2px;
      background: var(--colorSettings);
      color: #fff;
    }
  }

  > .nb-toolbar-container-icons {
    display: none;
    position: absolute;
    right: 2px;
    line-height: 16px;
    pointer-events: all;

    &.nb-toolbar-position-inside {
      top: 2px;
    }

    &.nb-toolbar-position-above {
      top: 0;
      transform: translateY(-100%);
      padding-bottom: 0;
      margin-bottom: -2px;
    }

    &.nb-toolbar-position-below {
      top: 0;
      transform: translateY(100%);
      padding-top: 2px;
      margin-top: -2px;
    }

    .ant-space-item {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      padding: 2px;
      line-height: 16px;
      background-color: var(--colorSettings);
      color: #fff;
    }
  }

  &.nb-toolbar-visible > .nb-toolbar-container-icons {
    display: block;
  }

  > .resize-handle {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: all;
    opacity: 0.6;
    border-radius: 4px;
    background: var(--colorSettings);

    &:hover {
      opacity: 0.9;
      background: var(--colorSettingsHover, var(--colorSettings));
    }

    &::before {
      content: '';
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
    }

    &::after {
      content: '';
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
    }
  }

  > .resize-handle-left {
    top: 50%;
    left: -4px;
    width: 6px;
    height: 20px;
    cursor: ew-resize;
    transform: translateY(-50%);

    &::before {
      top: 6px;
      left: 50%;
      width: 2px;
      height: 2px;
      transform: translateX(-50%);
      box-shadow:
        0 4px 0 rgba(255, 255, 255, 0.9),
        0 8px 0 rgba(255, 255, 255, 0.9);
    }
  }

  > .resize-handle-right {
    top: 50%;
    right: -4px;
    width: 6px;
    height: 20px;
    cursor: ew-resize;
    transform: translateY(-50%);

    &::before {
      top: 6px;
      left: 50%;
      width: 2px;
      height: 2px;
      transform: translateX(-50%);
      box-shadow:
        0 4px 0 rgba(255, 255, 255, 0.9),
        0 8px 0 rgba(255, 255, 255, 0.9);
    }
  }

  > .resize-handle-bottom {
    bottom: -4px;
    left: 50%;
    width: 20px;
    height: 6px;
    cursor: ns-resize;
    transform: translateX(-50%);

    &::before {
      top: 50%;
      left: 6px;
      width: 2px;
      height: 2px;
      transform: translateY(-50%);
      box-shadow:
        4px 0 0 rgba(255, 255, 255, 0.9),
        8px 0 0 rgba(255, 255, 255, 0.9);
    }
  }
`;

// 检测直接子节点里是否有按钮，保留原来的 inline-block 兼容行为。
const detectButtonInDOM = (container: HTMLElement): boolean => {
  if (!container) return false;

  const directChildren = container.children;
  for (let i = 0; i < directChildren.length; i++) {
    const child = directChildren[i];
    if (child.tagName === 'BUTTON' || child.getAttribute('role') === 'button' || child.classList.contains('ant-btn')) {
      return true;
    }
  }

  return false;
};

// 渲染工具栏项目，并让设置菜单与工具栏共享同一个 popup 容器。
const renderToolbarItems = (
  model: FlowModel,
  showDeleteButton: boolean,
  showCopyUidButton: boolean,
  flowEngine: FlowEngine,
  settingsMenuLevel?: number,
  extraToolbarItems?: ToolbarItemConfig[],
  onSettingsMenuOpenChange?: (open: boolean) => void,
  getPopupContainer?: (triggerNode?: HTMLElement) => HTMLElement,
) => {
  const toolbarItems = flowEngine?.flowSettings?.getToolbarItems?.() || [];
  const allToolbarItems = [...toolbarItems, ...(extraToolbarItems || [])];

  allToolbarItems.sort((a, b) => (a.sort || 0) - (b.sort || 0)).reverse();

  return allToolbarItems
    .filter((itemConfig: ToolbarItemConfig) => {
      return itemConfig.visible ? itemConfig.visible(model) : true;
    })
    .map((itemConfig: ToolbarItemConfig) => {
      const ItemComponent = itemConfig.component;

      if (itemConfig.key === 'settings-menu') {
        return (
          <ItemComponent
            key={itemConfig.key}
            model={model}
            id={model.uid}
            showDeleteButton={showDeleteButton}
            showCopyUidButton={showCopyUidButton}
            menuLevels={settingsMenuLevel}
            onDropdownVisibleChange={onSettingsMenuOpenChange}
            getPopupContainer={getPopupContainer}
          />
        );
      }

      return <ItemComponent key={itemConfig.key} model={model} />;
    });
};

const isNodeWithin = (target: EventTarget | null, container: HTMLElement | null): boolean => {
  return target instanceof Node && !!container?.contains(target);
};

const defaultPortalRect: ToolbarPortalRect = {
  top: 0,
  left: 0,
  width: 0,
  height: 0,
};

const getClosestElement = (hostEl: HTMLElement | null, selector: string) =>
  hostEl?.closest(selector) as HTMLElement | null;

// 优先解析 popup 自己的挂载根，保证 drawer / modal 内的 overlay 与内容共享坐标系。
const getPopupPortalHostConfig = (hostEl: HTMLElement | null): ToolbarPortalHostConfig | null => {
  const drawerWrapper = getClosestElement(hostEl, DRAWER_CONTENT_WRAPPER_SELECTOR);
  if (drawerWrapper) {
    return {
      mountElement: drawerWrapper,
      positioningElement: drawerWrapper,
      positioningMode: 'absolute',
    };
  }

  const modalContent = getClosestElement(hostEl, MODAL_CONTENT_SELECTOR);
  if (modalContent) {
    return {
      mountElement: modalContent,
      positioningElement: modalContent,
      positioningMode: 'absolute',
    };
  }

  const modal = getClosestElement(hostEl, MODAL_SELECTOR);
  if (modal) {
    return {
      mountElement: modal,
      positioningElement: modal,
      positioningMode: 'absolute',
    };
  }

  const modalWrap = getClosestElement(hostEl, MODAL_WRAP_SELECTOR);
  if (modalWrap) {
    return {
      mountElement: modalWrap,
      positioningElement: modalWrap,
      positioningMode: 'absolute',
    };
  }

  const drawerContent = getClosestElement(hostEl, DRAWER_CONTENT_SELECTOR);
  if (drawerContent) {
    const drawerContentWrapper = getClosestElement(drawerContent, DRAWER_CONTENT_WRAPPER_SELECTOR) || drawerContent;
    return {
      mountElement: drawerContentWrapper,
      positioningElement: drawerContentWrapper,
      positioningMode: 'absolute',
    };
  }

  const drawerRoot = getClosestElement(hostEl, DRAWER_ROOT_SELECTOR);
  if (drawerRoot) {
    return {
      mountElement: drawerRoot,
      positioningElement: drawerRoot,
      positioningMode: 'absolute',
    };
  }

  const modalRoot = getClosestElement(hostEl, MODAL_ROOT_SELECTOR);
  if (modalRoot) {
    return {
      mountElement: modalRoot,
      positioningElement: modalRoot,
      positioningMode: 'absolute',
    };
  }

  return null;
};

// portal 容器解析顺序：popup root -> #nocobase-app-container -> document.body。
const getToolbarPortalHostConfig = (hostEl: HTMLElement | null): ToolbarPortalHostConfig | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const popupRootConfig = getPopupPortalHostConfig(hostEl);
  if (popupRootConfig) {
    return popupRootConfig;
  }

  const appContainer = document.querySelector(APP_CONTAINER_SELECTOR) as HTMLElement | null;
  if (appContainer) {
    return {
      mountElement: appContainer,
      positioningElement: appContainer,
      positioningMode: 'absolute',
    };
  }

  return {
    mountElement: document.body,
    positioningElement: document.body,
    positioningMode: 'fixed',
  };
};

const isSamePortalHostConfig = (
  prevConfig: ToolbarPortalHostConfig | null,
  nextConfig: ToolbarPortalHostConfig | null,
) => {
  if (!prevConfig || !nextConfig) {
    return prevConfig === nextConfig;
  }

  return (
    prevConfig.mountElement === nextConfig.mountElement &&
    prevConfig.positioningElement === nextConfig.positioningElement &&
    prevConfig.positioningMode === nextConfig.positioningMode
  );
};

const parseToolbarInsetValue = (value: React.CSSProperties['top']) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    if (/^-?\d+(\.\d+)?(px)?$/.test(trimmedValue)) {
      return Number.parseFloat(trimmedValue);
    }
  }

  return 0;
};

const resolveToolbarPortalInset = (toolbarStyle?: React.CSSProperties): ToolbarPortalInset => {
  return {
    top: parseToolbarInsetValue(toolbarStyle?.top),
    left: parseToolbarInsetValue(toolbarStyle?.left),
    right: parseToolbarInsetValue(toolbarStyle?.right),
    bottom: parseToolbarInsetValue(toolbarStyle?.bottom),
  };
};

const omitToolbarPortalInsetStyle = (toolbarStyle?: React.CSSProperties): React.CSSProperties | undefined => {
  if (!toolbarStyle) {
    return undefined;
  }

  const nextStyle = { ...toolbarStyle };
  delete nextStyle.top;
  delete nextStyle.left;
  delete nextStyle.right;
  delete nextStyle.bottom;
  return nextStyle;
};

// 当 portal 容器本身不是实际 offsetParent 时，改用真实定位上下文计算相对坐标。
const getAbsolutePositioningElement = (
  toolbarEl: HTMLElement | null,
  portalHostConfig: ToolbarPortalHostConfig | null,
) => {
  if (!portalHostConfig || portalHostConfig.positioningMode !== 'absolute') {
    return portalHostConfig?.positioningElement || null;
  }

  const offsetParent = toolbarEl?.offsetParent;
  if (
    offsetParent instanceof HTMLElement &&
    offsetParent !== document.body &&
    offsetParent !== document.documentElement
  ) {
    return offsetParent;
  }

  return portalHostConfig.positioningElement;
};

// 将 host 的 viewport rect 转成 portal 容器内的 overlay rect。
// `toolbarStyle.top/left/right/bottom` 在这里按 inset 语义处理，而不是直接覆盖定位值。
const calculatePortalRect = (
  hostEl: HTMLElement | null,
  portalHostConfig: ToolbarPortalHostConfig | null,
  toolbarStyle?: React.CSSProperties,
  toolbarEl?: HTMLElement | null,
): ToolbarPortalRect => {
  if (!hostEl) {
    return defaultPortalRect;
  }

  const inset = resolveToolbarPortalInset(toolbarStyle);
  const hostRect = hostEl.getBoundingClientRect();

  let rect: ToolbarPortalRect;
  if (!portalHostConfig || portalHostConfig.positioningMode === 'fixed') {
    rect = {
      top: hostRect.top,
      left: hostRect.left,
      width: hostRect.width,
      height: hostRect.height,
    };
  } else {
    const positioningElement = getAbsolutePositioningElement(toolbarEl || null, portalHostConfig);
    const portalHostRect =
      positioningElement?.getBoundingClientRect() || portalHostConfig.positioningElement.getBoundingClientRect();
    const scrollTop = positioningElement?.scrollTop ?? portalHostConfig.positioningElement.scrollTop;
    const scrollLeft = positioningElement?.scrollLeft ?? portalHostConfig.positioningElement.scrollLeft;

    rect = {
      top: hostRect.top - portalHostRect.top + scrollTop,
      left: hostRect.left - portalHostRect.left + scrollLeft,
      width: hostRect.width,
      height: hostRect.height,
    };
  }

  return {
    top: rect.top + inset.top,
    left: rect.left + inset.left,
    width: Math.max(0, rect.width - inset.left - inset.right),
    height: Math.max(0, rect.height - inset.top - inset.bottom),
  };
};

/**
 * 悬浮工具栏组件接口
 */
interface ModelProvidedProps {
  model: FlowModel<any>;
  children?: React.ReactNode;
  enabled?: boolean;
  showDeleteButton?: boolean;
  showCopyUidButton?: boolean;
  containerStyle?: React.CSSProperties;
  /** 自定义工具栏样式，`top/left/right/bottom` 会作为 portal overlay 的 inset 使用。 */
  toolbarStyle?: React.CSSProperties;
  className?: string;
  /**
   * @default true
   */
  showBorder?: boolean;
  /**
   * @default true
   */
  showBackground?: boolean;
  /**
   * @default false
   */
  showTitle?: boolean;
  /**
   * @default false
   */
  showDragHandle?: boolean;
  /**
   * Settings menu levels: 1=current model only (default), 2=include sub-models
   */
  settingsMenuLevel?: number;
  /**
   * Extra toolbar items to add to this context menu instance
   */
  extraToolbarItems?: ToolbarItemConfig[];
  /**
   * @default 'inside'
   */
  toolbarPosition?: ToolbarPosition;
}

interface ModelByIdProps {
  uid: string;
  modelClassName: string;
  children?: React.ReactNode;
  enabled?: boolean;
  showDeleteButton?: boolean;
  showCopyUidButton?: boolean;
  containerStyle?: React.CSSProperties;
  /** 自定义工具栏样式，`top/left/right/bottom` 会作为 portal overlay 的 inset 使用。 */
  toolbarStyle?: React.CSSProperties;
  className?: string;
  /**
   * @default true
   */
  showBorder?: boolean;
  /**
   * @default true
   */
  showBackground?: boolean;
  /**
   * @default false
   */
  showTitle?: boolean;
  /**
   * @default false
   */
  showDragHandle?: boolean;
  /**
   * Settings menu levels: 1=current model only (default), 2=include sub-models
   */
  settingsMenuLevel?: number;
  /**
   * Extra toolbar items to add to this context menu instance
   */
  extraToolbarItems?: ToolbarItemConfig[];
  /**
   * @default 'inside'
   */
  toolbarPosition?: ToolbarPosition;
}

type FlowsFloatContextMenuProps = ModelProvidedProps | ModelByIdProps;

// 判断是否是通过ID获取模型的 props
const isModelByIdProps = (props: FlowsFloatContextMenuProps): props is ModelByIdProps => {
  return 'uid' in props && 'modelClassName' in props && Boolean(props.uid) && Boolean(props.modelClassName);
};

/**
 * FlowsFloatContextMenu组件 - 悬浮配置工具栏组件
 *
 * 功能特性：
 * - 鼠标悬浮显示右上角配置图标
 * - 点击图标显示配置菜单
 * - 支持删除功能
 * - Wrapper 模式支持
 * - 使用 portal overlay 避免被宿主或祖先裁剪
 * - 设置菜单与工具栏共享同一个 popup 容器
 *
 * 支持两种使用方式：
 * 1. 直接提供 model: `<FlowsFloatContextMenu model={myModel}>{children}</FlowsFloatContextMenu>`
 * 2. 通过 uid 和 modelClassName 获取 model:
 *    `<FlowsFloatContextMenu uid="model1" modelClassName="MyModel">{children}</FlowsFloatContextMenu>`
 *
 * @param props.children 子组件，必须提供
 * @param props.enabled 是否启用悬浮菜单，默认为 true
 * @param props.showDeleteButton 是否显示删除按钮，默认为 true
 * @param props.showCopyUidButton 是否显示复制 UID 按钮，默认为 true
 * @param props.containerStyle 容器自定义样式
 * @param props.toolbarStyle 工具栏自定义样式；`top/left/right/bottom` 会作为 portal overlay 的 inset 使用
 * @param props.className 容器自定义类名
 * @param props.showTitle 是否在边框左上角显示模型 title，默认为 false
 * @param props.settingsMenuLevel 设置菜单层级：1=仅当前模型(默认)，2=包含子模型
 * @param props.extraToolbarItems 额外的工具栏项目，仅应用于此实例
 */
const FlowsFloatContextMenu: React.FC<FlowsFloatContextMenuProps> = observer((props) => {
  const ctx = useFlowContext();
  if (!ctx.flowSettingsEnabled) {
    return <>{props.children}</>;
  }
  if (isModelByIdProps(props)) {
    return <FlowsFloatContextMenuWithModelById {...props} />;
  }
  return <FlowsFloatContextMenuWithModel {...props} />;
});

const ResizeHandles: React.FC<{
  model: FlowModel;
  onDragStart: () => void;
  onDragEnd: () => void;
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
}> = (props) => {
  const isDraggingRef = useRef<boolean>(false);
  const dragTypeRef = useRef<'left' | 'right' | 'bottom' | 'corner' | null>(null);
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const { onDragStart, onDragEnd } = props;

  // 把拖拽位移转成上层已约定的 resize 事件。
  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current || !dragTypeRef.current) return;

      const deltaX = e.clientX - dragStartPosRef.current.x;
      const deltaY = e.clientY - dragStartPosRef.current.y;

      switch (dragTypeRef.current) {
        case 'left':
          props.model.parent.emitter.emit('onResizeLeft', { resizeDistance: -deltaX, model: props.model });
          break;
        case 'right':
          props.model.parent.emitter.emit('onResizeRight', { resizeDistance: deltaX, model: props.model });
          break;
        case 'bottom':
          props.model.parent.emitter.emit('onResizeBottom', { resizeDistance: deltaY, model: props.model });
          break;
        case 'corner':
          props.model.parent.emitter.emit('onResizeCorner', {
            widthDelta: deltaX,
            heightDelta: deltaY,
            model: props.model,
          });
          break;
      }
    },
    [props.model],
  );

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    dragTypeRef.current = null;
    dragStartPosRef.current = { x: 0, y: 0 };

    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);

    props.model.parent.emitter.emit('onResizeEnd');
    onDragEnd?.();
  }, [handleDragMove, onDragEnd, props.model]);

  const handleDragStart = useCallback(
    (e: React.MouseEvent, type: 'left' | 'right' | 'bottom' | 'corner') => {
      e.preventDefault();
      e.stopPropagation();

      isDraggingRef.current = true;
      dragTypeRef.current = type;
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };

      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);

      onDragStart?.();
    },
    [handleDragMove, handleDragEnd, onDragStart],
  );

  return (
    <>
      <div
        className="resize-handle resize-handle-left"
        title="拖拽调节宽度"
        onMouseEnter={props.onMouseEnter}
        onMouseLeave={props.onMouseLeave}
        onMouseDown={(e) => handleDragStart(e, 'left')}
      />
      <div
        className="resize-handle resize-handle-right"
        title="拖拽调节宽度"
        onMouseEnter={props.onMouseEnter}
        onMouseLeave={props.onMouseLeave}
        onMouseDown={(e) => handleDragStart(e, 'right')}
      />
    </>
  );
};

// 使用直接传入的 model 渲染工具栏。
const FlowsFloatContextMenuWithModel: React.FC<ModelProvidedProps> = observer(
  ({
    model,
    children,
    enabled = true,
    showDeleteButton = true,
    showCopyUidButton = true,
    containerStyle,
    className,
    showBackground = true,
    showBorder = true,
    showTitle = false,
    showDragHandle = false,
    settingsMenuLevel,
    extraToolbarItems,
    toolbarStyle,
    toolbarPosition = 'inside',
  }: ModelProvidedProps) => {
    const [hideMenu, setHideMenu] = useState(false);
    const [hasButton, setHasButton] = useState(false);
    const [isHostHovered, setIsHostHovered] = useState(false);
    const [isToolbarHovered, setIsToolbarHovered] = useState(false);
    const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
    const [isToolbarPinned, setIsToolbarPinned] = useState(false);
    const [activeChildToolbarIds, setActiveChildToolbarIds] = useState<string[]>([]);
    const [portalRect, setPortalRect] = useState<ToolbarPortalRect>(defaultPortalRect);
    const [portalHostConfig, setPortalHostConfig] = useState<ToolbarPortalHostConfig | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const toolbarContainerRef = useRef<HTMLDivElement>(null);
    const portalRafIdRef = useRef<number | null>(null);
    const hideToolbarTimerRef = useRef<number | null>(null);
    const reportedChildActivityToAncestorsRef = useRef(false);
    const flowEngine = useFlowEngine();
    const hasActiveChildToolbar = activeChildToolbarIds.length > 0;
    const isToolbarVisible =
      !hideMenu &&
      !hasActiveChildToolbar &&
      (isHostHovered || isToolbarHovered || isDraggingToolbar || isToolbarPinned);
    const isToolbarInteractionActive =
      isHostHovered || isToolbarHovered || isDraggingToolbar || isToolbarPinned || hideToolbarTimerRef.current !== null;

    const clearHideToolbarTimer = useCallback(() => {
      if (hideToolbarTimerRef.current !== null) {
        window.clearTimeout(hideToolbarTimerRef.current);
        hideToolbarTimerRef.current = null;
      }
    }, []);

    const updatePortalRect = useCallback(() => {
      if (!containerRef.current) {
        return;
      }

      const nextPortalHostConfig = getToolbarPortalHostConfig(containerRef.current);
      const nextRect = calculatePortalRect(
        containerRef.current,
        nextPortalHostConfig,
        toolbarStyle,
        toolbarContainerRef.current,
      );

      setPortalHostConfig((prevConfig) => {
        return isSamePortalHostConfig(prevConfig, nextPortalHostConfig) ? prevConfig : nextPortalHostConfig;
      });

      setPortalRect((prevRect) => {
        if (
          prevRect.top === nextRect.top &&
          prevRect.left === nextRect.left &&
          prevRect.width === nextRect.width &&
          prevRect.height === nextRect.height
        ) {
          return prevRect;
        }
        return nextRect;
      });
    }, [toolbarStyle]);

    const schedulePortalRectUpdate = useCallback(() => {
      if (portalRafIdRef.current !== null) {
        return;
      }

      portalRafIdRef.current = window.requestAnimationFrame(() => {
        portalRafIdRef.current = null;
        updatePortalRect();
      });
    }, [updatePortalRect]);

    const scheduleHideToolbar = useCallback(() => {
      clearHideToolbarTimer();
      hideToolbarTimerRef.current = window.setTimeout(() => {
        hideToolbarTimerRef.current = null;
        if (isDraggingToolbar || isToolbarPinned) {
          return;
        }
        setIsHostHovered(false);
        setIsToolbarHovered(false);
      }, TOOLBAR_HIDE_DELAY);
    }, [clearHideToolbarTimer, isDraggingToolbar, isToolbarPinned]);

    const getPopupContainer = useCallback(
      (triggerNode?: HTMLElement) => {
        return (
          portalHostConfig?.mountElement ||
          getToolbarPortalHostConfig(triggerNode || containerRef.current)?.mountElement ||
          document.body
        );
      },
      [portalHostConfig],
    );

    const handleSettingsMenuOpenChange = useCallback((open: boolean) => {
      setIsToolbarPinned(open);
    }, []);

    const toolbarItems = useMemo(
      () =>
        renderToolbarItems(
          model,
          showDeleteButton,
          showCopyUidButton,
          flowEngine,
          settingsMenuLevel,
          extraToolbarItems,
          handleSettingsMenuOpenChange,
          getPopupContainer,
        ),
      [
        extraToolbarItems,
        flowEngine,
        getPopupContainer,
        handleSettingsMenuOpenChange,
        model,
        portalHostConfig,
        settingsMenuLevel,
        showCopyUidButton,
        showDeleteButton,
      ],
    );

    useLayoutEffect(() => {
      updatePortalRect();
    }, [updatePortalRect]);

    // 监听可见期间的尺寸与滚动变化，持续同步 portal overlay 的坐标。
    useEffect(() => {
      if (!isToolbarVisible) {
        return;
      }

      updatePortalRect();

      const handleViewportChange = () => {
        schedulePortalRectUpdate();
      };

      const resizeObserver =
        typeof ResizeObserver !== 'undefined' && containerRef.current
          ? new ResizeObserver(() => {
              schedulePortalRectUpdate();
            })
          : null;

      if (containerRef.current) {
        resizeObserver?.observe(containerRef.current);
      }
      if (portalHostConfig?.mountElement && portalHostConfig.mountElement !== containerRef.current) {
        resizeObserver?.observe(portalHostConfig.mountElement);
      }
      if (
        portalHostConfig?.positioningElement &&
        portalHostConfig.positioningElement !== containerRef.current &&
        portalHostConfig.positioningElement !== portalHostConfig.mountElement
      ) {
        resizeObserver?.observe(portalHostConfig.positioningElement);
      }

      window.addEventListener('resize', handleViewportChange);
      window.addEventListener('scroll', handleViewportChange, true);

      return () => {
        resizeObserver?.disconnect();
        window.removeEventListener('resize', handleViewportChange);
        window.removeEventListener('scroll', handleViewportChange, true);
      };
    }, [isToolbarVisible, portalHostConfig, schedulePortalRectUpdate, updatePortalRect]);

    // 子级工具栏激活时隐藏父级工具栏，避免多层 overlay 同时压住内容。
    useEffect(() => {
      const hostElement = containerRef.current;
      if (!hostElement) {
        return;
      }

      const handleChildToolbarActivity = (event: Event) => {
        const customEvent = event as CustomEvent<{ active?: boolean; modelUid?: string }>;
        if (!(customEvent.target instanceof HTMLElement) || customEvent.target === hostElement) {
          return;
        }

        const childModelUid = customEvent.detail?.modelUid;
        if (!childModelUid) {
          return;
        }

        setActiveChildToolbarIds((prevIds) => {
          return customEvent.detail?.active
            ? prevIds.includes(childModelUid)
              ? prevIds
              : [...prevIds, childModelUid]
            : prevIds.filter((id) => id !== childModelUid);
        });
      };

      hostElement.addEventListener(CHILD_FLOAT_MENU_ACTIVITY_EVENT, handleChildToolbarActivity as EventListener);
      return () => {
        hostElement.removeEventListener(CHILD_FLOAT_MENU_ACTIVITY_EVENT, handleChildToolbarActivity as EventListener);
      };
    }, []);

    // 将当前工具栏的激活状态继续向祖先冒泡。
    useEffect(() => {
      const hostElement = containerRef.current;
      if (!hostElement || reportedChildActivityToAncestorsRef.current === isToolbarInteractionActive) {
        return;
      }

      reportedChildActivityToAncestorsRef.current = isToolbarInteractionActive;
      hostElement.dispatchEvent(
        new CustomEvent(CHILD_FLOAT_MENU_ACTIVITY_EVENT, {
          bubbles: true,
          detail: { active: isToolbarInteractionActive, modelUid: model.uid },
        }),
      );
    }, [isToolbarInteractionActive, model.uid]);

    // 卸载时撤销对子级激活状态的上报，并清理定时器 / raf。
    useEffect(() => {
      return () => {
        if (containerRef.current && reportedChildActivityToAncestorsRef.current) {
          containerRef.current.dispatchEvent(
            new CustomEvent(CHILD_FLOAT_MENU_ACTIVITY_EVENT, {
              bubbles: true,
              detail: { active: false, modelUid: model.uid },
            }),
          );
          reportedChildActivityToAncestorsRef.current = false;
        }
        if (portalRafIdRef.current !== null) {
          window.cancelAnimationFrame(portalRafIdRef.current);
        }
        clearHideToolbarTimer();
      };
    }, [clearHideToolbarTimer, model.uid]);

    // dropdown 打开期间保持工具栏 pinned，不触发延迟隐藏。
    useEffect(() => {
      if (isToolbarPinned) {
        clearHideToolbarTimer();
      }
    }, [clearHideToolbarTimer, isToolbarPinned]);

    // children 结构变化后，重新检测按钮子节点。
    useEffect(() => {
      if (containerRef.current) {
        setHasButton(detectButtonInDOM(containerRef.current));
      }
    }, [children]);

    // DOM 动态变化时同步更新 hasButton。
    useEffect(() => {
      if (!containerRef.current) return;

      const observer = new MutationObserver(() => {
        if (containerRef.current) {
          setHasButton(detectButtonInDOM(containerRef.current));
        }
      });

      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'role'],
      });

      return () => {
        observer.disconnect();
      };
    }, []);

    const handleChildHover = useCallback((e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      const childWithMenu = target.closest('[data-has-float-menu]');
      setHideMenu(!!childWithMenu && childWithMenu !== containerRef.current);
    }, []);

    const handleHostMouseEnter = useCallback(() => {
      clearHideToolbarTimer();
      setHideMenu(false);
      updatePortalRect();
      setIsHostHovered(true);
    }, [clearHideToolbarTimer, updatePortalRect]);

    const handleHostMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isToolbarPinned) {
          setIsHostHovered(false);
          return;
        }
        if (isNodeWithin(e.relatedTarget, toolbarContainerRef.current)) {
          clearHideToolbarTimer();
          setIsHostHovered(false);
          setIsToolbarHovered(true);
          return;
        }
        scheduleHideToolbar();
      },
      [clearHideToolbarTimer, isToolbarPinned, scheduleHideToolbar],
    );

    const handleToolbarMouseEnter = useCallback(() => {
      clearHideToolbarTimer();
      updatePortalRect();
      setIsHostHovered(false);
      setIsToolbarHovered(true);
    }, [clearHideToolbarTimer, updatePortalRect]);

    const handleToolbarMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isToolbarPinned) {
          setIsToolbarHovered(false);
          return;
        }
        setIsToolbarHovered(false);
        if (isNodeWithin(e.relatedTarget, containerRef.current)) {
          clearHideToolbarTimer();
          setIsHostHovered(true);
          return;
        }
        scheduleHideToolbar();
      },
      [clearHideToolbarTimer, isToolbarPinned, scheduleHideToolbar],
    );

    if (!model) {
      const t = getT(model || ({} as FlowModel));
      return <Alert message={t('Invalid model provided')} type="error" />;
    }

    if (!enabled || !children) {
      return <>{children}</>;
    }

    const toolbarContainerClassName = [
      toolbarContainerStyles({ showBackground, showBorder, ctx: model.context }),
      'nb-toolbar-portal',
      portalHostConfig?.positioningMode === 'absolute' ? 'nb-toolbar-portal-absolute' : 'nb-toolbar-portal-fixed',
      isToolbarVisible ? 'nb-toolbar-visible' : '',
      className?.includes('nb-in-template') ? 'nb-in-template' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const toolbarContainerStyle = {
      top: `${portalRect.top}px`,
      left: `${portalRect.left}px`,
      width: `${portalRect.width}px`,
      height: `${portalRect.height}px`,
      ...omitToolbarPortalInsetStyle(toolbarStyle),
    } satisfies React.CSSProperties;

    const toolbarNode = (
      <div
        ref={toolbarContainerRef}
        className={`nb-toolbar-container ${toolbarContainerClassName}`}
        style={toolbarContainerStyle}
        data-model-uid={model.uid}
      >
        {showTitle && (model.title || model.extraTitle) && (
          <div className="nb-toolbar-container-title">
            {model.title && <span className="title-tag">{model.title}</span>}
            {model.extraTitle && <span className="title-tag">{model.extraTitle}</span>}
          </div>
        )}
        <div
          className={`nb-toolbar-container-icons ${toolbarPositionClassNames[toolbarPosition]}`}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseMove={(e) => e.stopPropagation()}
          onMouseEnter={handleToolbarMouseEnter}
          onMouseLeave={handleToolbarMouseLeave}
        >
          <Space size={3} align="center">
            {toolbarItems}
          </Space>
        </div>

        {showDragHandle && (
          <ResizeHandles
            model={model}
            onMouseEnter={handleToolbarMouseEnter}
            onMouseLeave={handleToolbarMouseLeave}
            onDragStart={() => {
              setIsDraggingToolbar(true);
              schedulePortalRectUpdate();
            }}
            onDragEnd={() => {
              setIsDraggingToolbar(false);
              schedulePortalRectUpdate();
            }}
          />
        )}
      </div>
    );

    return (
      <div
        ref={containerRef}
        className={`${hostContainerStyles} ${hasButton ? 'has-button-child' : ''} ${className || ''}`}
        style={containerStyle}
        data-has-float-menu="true"
        onMouseMove={handleChildHover}
        onMouseEnter={handleHostMouseEnter}
        onMouseLeave={handleHostMouseLeave}
      >
        {children}
        {portalHostConfig?.mountElement ? createPortal(toolbarNode, portalHostConfig.mountElement) : toolbarNode}
      </div>
    );
  },
  {
    displayName: 'FlowsFloatContextMenuWithModel',
  },
);

// 通过 uid + modelClassName 解析 model，再复用主实现。
const FlowsFloatContextMenuWithModelById: React.FC<ModelByIdProps> = observer(
  ({
    uid,
    modelClassName,
    children,
    enabled = true,
    showDeleteButton = true,
    showCopyUidButton = true,
    containerStyle,
    className,
    showTitle = false,
    settingsMenuLevel,
    extraToolbarItems,
    toolbarPosition,
    showBackground = true,
    showBorder = true,
    toolbarStyle,
    showDragHandle = false,
  }) => {
    const model = useFlowModelById(uid, modelClassName);
    const flowEngine = useFlowEngine();

    if (!model) {
      return <Alert message={flowEngine.translate('Model with ID {{uid}} not found', { uid })} type="error" />;
    }

    return (
      <FlowsFloatContextMenuWithModel
        model={model}
        enabled={enabled}
        showDeleteButton={showDeleteButton}
        showCopyUidButton={showCopyUidButton}
        containerStyle={containerStyle}
        className={className}
        showTitle={showTitle}
        showBackground={showBackground}
        showBorder={showBorder}
        showDragHandle={showDragHandle}
        settingsMenuLevel={settingsMenuLevel}
        extraToolbarItems={extraToolbarItems}
        toolbarStyle={toolbarStyle}
        toolbarPosition={toolbarPosition}
      >
        {children}
      </FlowsFloatContextMenuWithModel>
    );
  },
  {
    displayName: 'FlowsFloatContextMenuWithModelById',
  },
);

export { FlowsFloatContextMenu };
