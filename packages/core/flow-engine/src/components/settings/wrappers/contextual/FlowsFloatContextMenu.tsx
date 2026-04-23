/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
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
import {
  omitToolbarPortalInsetStyle,
  ToolbarPortalRect,
  ToolbarPortalRenderSnapshot,
  useFloatToolbarPortal,
} from './useFloatToolbarPortal';
import { useFloatToolbarVisibility } from './useFloatToolbarVisibility';

const TOOLBAR_Z_INDEX = 999;

type ToolbarPosition = 'inside' | 'above' | 'below';

interface BaseFloatContextMenuProps {
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

const getFloatMenuInstanceId = (model?: FlowModel | null) => {
  if (!model) {
    return '';
  }

  const forkId = (model as any)?.isFork ? (model as any)?.forkId : undefined;
  return forkId == null || forkId === '' ? String(model.uid || '') : `${String(model.uid || '')}::${String(forkId)}`;
};

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
  modelInstanceId: string,
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
            id={modelInstanceId}
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

const buildToolbarContainerClassName = ({
  showBackground,
  showBorder,
  ctx,
  portalRenderSnapshot,
  isToolbarVisible,
  className,
}: {
  showBackground: boolean;
  showBorder: boolean;
  ctx: any;
  portalRenderSnapshot: ToolbarPortalRenderSnapshot | null;
  isToolbarVisible: boolean;
  className?: string;
}) =>
  [
    toolbarContainerStyles({ showBackground, showBorder, ctx }),
    'nb-toolbar-portal',
    portalRenderSnapshot?.positioningMode === 'absolute' ? 'nb-toolbar-portal-absolute' : 'nb-toolbar-portal-fixed',
    isToolbarVisible ? 'nb-toolbar-visible' : '',
    className?.includes('nb-in-template') ? 'nb-in-template' : '',
  ]
    .filter(Boolean)
    .join(' ');

const buildToolbarContainerStyle = (
  portalRect: ToolbarPortalRect,
  toolbarStyle?: React.CSSProperties,
): React.CSSProperties => ({
  top: `${portalRect.top}px`,
  left: `${portalRect.left}px`,
  width: `${portalRect.width}px`,
  height: `${portalRect.height}px`,
  ...omitToolbarPortalInsetStyle(toolbarStyle),
});

interface ModelProvidedProps extends BaseFloatContextMenuProps {
  model: FlowModel<any>;
}

interface ModelByIdProps extends BaseFloatContextMenuProps {
  uid: string;
  modelClassName: string;
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
  const dragTypeRef = useRef<'left' | 'right' | null>(null);
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const { onDragStart, onDragEnd } = props;

  // 把拖拽位移转成上层已约定的 resize 事件。
  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current || !dragTypeRef.current) return;

      const deltaX = e.clientX - dragStartPosRef.current.x;

      switch (dragTypeRef.current) {
        case 'left':
          props.model.parent.emitter.emit('onResizeLeft', { resizeDistance: -deltaX, model: props.model });
          break;
        case 'right':
          props.model.parent.emitter.emit('onResizeRight', { resizeDistance: deltaX, model: props.model });
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
    (e: React.MouseEvent, type: 'left' | 'right') => {
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
    const [hasButton, setHasButton] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const toolbarContainerRef = useRef<HTMLDivElement>(null);
    const portalActionsRef = useRef<{
      updatePortalRect: () => void;
      schedulePortalRectUpdate: () => void;
    }>({
      updatePortalRect: () => {},
      schedulePortalRectUpdate: () => {},
    });
    const modelUid = getFloatMenuInstanceId(model);
    const flowEngine = useFlowEngine();
    const updatePortalRectProxy = useCallback(() => {
      portalActionsRef.current.updatePortalRect();
    }, []);
    const schedulePortalRectUpdateProxy = useCallback(() => {
      portalActionsRef.current.schedulePortalRectUpdate();
    }, []);
    const {
      isToolbarVisible,
      shouldRenderToolbar,
      handleSettingsMenuOpenChange,
      handleChildHover,
      handleHostMouseEnter,
      handleHostMouseLeave,
      handleToolbarMouseEnter,
      handleToolbarMouseLeave,
      handleResizeDragStart,
      handleResizeDragEnd,
    } = useFloatToolbarVisibility({
      modelUid,
      containerRef,
      toolbarContainerRef,
      updatePortalRect: updatePortalRectProxy,
      schedulePortalRectUpdate: schedulePortalRectUpdateProxy,
    });
    const { portalRect, portalRenderSnapshot, getPopupContainer, updatePortalRect, schedulePortalRectUpdate } =
      useFloatToolbarPortal({
        active: shouldRenderToolbar,
        containerRef,
        toolbarContainerRef,
        toolbarStyle,
      });

    portalActionsRef.current.updatePortalRect = updatePortalRect;
    portalActionsRef.current.schedulePortalRectUpdate = schedulePortalRectUpdate;

    const toolbarItems = useMemo(
      () =>
        model
          ? renderToolbarItems(
              model,
              modelUid,
              showDeleteButton,
              showCopyUidButton,
              flowEngine,
              settingsMenuLevel,
              extraToolbarItems,
              handleSettingsMenuOpenChange,
              getPopupContainer,
            )
          : [],
      [
        extraToolbarItems,
        flowEngine,
        getPopupContainer,
        handleSettingsMenuOpenChange,
        model,
        settingsMenuLevel,
        showCopyUidButton,
        showDeleteButton,
      ],
    );

    useEffect(() => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      const syncHasButton = () => {
        setHasButton(detectButtonInDOM(container));
      };

      syncHasButton();

      const observer = new MutationObserver(syncHasButton);
      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'role'],
      });

      return () => {
        observer.disconnect();
      };
    }, []);

    if (!model) {
      const t = getT(model || ({} as FlowModel));
      return <Alert message={t('Invalid model provided')} type="error" />;
    }

    if (!enabled || !children) {
      return <>{children}</>;
    }

    const toolbarContainerClassName = buildToolbarContainerClassName({
      showBackground,
      showBorder,
      ctx: model.context,
      portalRenderSnapshot,
      isToolbarVisible,
      className,
    });
    const toolbarContainerStyle = buildToolbarContainerStyle(portalRect, toolbarStyle);

    const toolbarNode = shouldRenderToolbar ? (
      <div
        ref={toolbarContainerRef}
        className={`nb-toolbar-container ${toolbarContainerClassName}`}
        style={toolbarContainerStyle}
        data-model-uid={modelUid}
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
            onDragStart={handleResizeDragStart}
            onDragEnd={handleResizeDragEnd}
          />
        )}
      </div>
    ) : null;

    return (
      <div
        ref={containerRef}
        className={`${hostContainerStyles} ${hasButton ? 'has-button-child' : ''} ${className || ''}`}
        style={containerStyle}
        data-has-float-menu="true"
        data-float-menu-model-uid={modelUid}
        onMouseMove={handleChildHover}
        onMouseEnter={handleHostMouseEnter}
        onMouseLeave={handleHostMouseLeave}
      >
        {children}
        {toolbarNode &&
          (portalRenderSnapshot?.mountElement
            ? createPortal(toolbarNode, portalRenderSnapshot.mountElement)
            : toolbarNode)}
      </div>
    );
  },
  {
    displayName: 'FlowsFloatContextMenuWithModel',
  },
);

// 通过 uid + modelClassName 解析 model，再复用主实现。
const FlowsFloatContextMenuWithModelById: React.FC<ModelByIdProps> = observer(
  ({ uid, modelClassName, children, ...restProps }) => {
    const model = useFlowModelById(uid, modelClassName);
    const flowEngine = useFlowEngine();

    if (!model) {
      return <Alert message={flowEngine.translate('Model with ID {{uid}} not found', { uid })} type="error" />;
    }

    return (
      <FlowsFloatContextMenuWithModel model={model} {...restProps}>
        {children}
      </FlowsFloatContextMenuWithModel>
    );
  },
  {
    displayName: 'FlowsFloatContextMenuWithModelById',
  },
);

export { FlowsFloatContextMenu };
