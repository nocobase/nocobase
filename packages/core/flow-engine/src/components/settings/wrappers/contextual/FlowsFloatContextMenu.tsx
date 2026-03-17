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

// 检测DOM中直接子元素是否包含button元素的辅助函数
const detectButtonInDOM = (container: HTMLElement): boolean => {
  if (!container) return false;

  // 只检测直接子元素中的button
  const directChildren = container.children;
  for (let i = 0; i < directChildren.length; i++) {
    const child = directChildren[i];
    // 检查是否是button元素或具有button特征的元素
    if (child.tagName === 'BUTTON' || child.getAttribute('role') === 'button' || child.classList.contains('ant-btn')) {
      return true;
    }
  }

  return false;
};

// 渲染工具栏项目的辅助函数
const renderToolbarItems = (
  model: FlowModel,
  showDeleteButton: boolean,
  showCopyUidButton: boolean,
  flowEngine: FlowEngine,
  settingsMenuLevel?: number,
  extraToolbarItems?: ToolbarItemConfig[],
) => {
  const toolbarItems = flowEngine?.flowSettings?.getToolbarItems?.() || [];

  // 合并额外的工具栏项目
  const allToolbarItems = [...toolbarItems, ...(extraToolbarItems || [])];

  // 按 sort 字段排序
  allToolbarItems.sort((a, b) => (a.sort || 0) - (b.sort || 0)).reverse();

  return allToolbarItems
    .filter((itemConfig: ToolbarItemConfig) => {
      // 检查项目是否应该显示
      return itemConfig.visible ? itemConfig.visible(model) : true;
    })
    .map((itemConfig: ToolbarItemConfig) => {
      // 渲染项目组件
      const ItemComponent = itemConfig.component;

      // 对于默认设置项目，传递额外的 props
      if (itemConfig.key === 'settings-menu') {
        return (
          <ItemComponent
            key={itemConfig.key}
            model={model}
            id={model.uid} // 用于拖拽的 id
            showDeleteButton={showDeleteButton}
            showCopyUidButton={showCopyUidButton}
            menuLevels={settingsMenuLevel}
          />
        );
      }

      // 其他项目只传递 model
      return <ItemComponent key={itemConfig.key} model={model} />;
    });
};

// Width in pixels per toolbar item (icon width + spacing)
const TOOLBAR_ITEM_WIDTH = 19;
const TOOLBAR_Z_INDEX = 999;

type ToolbarPosition = 'inside' | 'above' | 'below';
type ToolbarRenderMode = 'portal' | 'inline';

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

  &.nb-toolbar-inline {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }

  &.nb-toolbar-portal {
    position: fixed;
    top: 0;
    left: 0;
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

const isNodeWithin = (target: EventTarget | null, container: HTMLElement | null): boolean => {
  return target instanceof Node && !!container?.contains(target);
};

// 悬浮右键菜单组件接口
interface ModelProvidedProps {
  model: FlowModel<any>;
  children?: React.ReactNode;
  enabled?: boolean;
  showDeleteButton?: boolean;
  showCopyUidButton?: boolean;
  containerStyle?: React.CSSProperties;
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
  /**
   * @default 'portal'
   */
  toolbarRenderMode?: ToolbarRenderMode;
}

interface ModelByIdProps {
  uid: string;
  modelClassName: string;
  children?: React.ReactNode;
  enabled?: boolean;
  showDeleteButton?: boolean;
  showCopyUidButton?: boolean;
  containerStyle?: React.CSSProperties;
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
  /**
   * @default 'portal'
   */
  toolbarRenderMode?: ToolbarRenderMode;
}

type FlowsFloatContextMenuProps = ModelProvidedProps | ModelByIdProps;

// 判断是否是通过ID获取模型的props
const isModelByIdProps = (props: FlowsFloatContextMenuProps): props is ModelByIdProps => {
  return 'uid' in props && 'modelClassName' in props && Boolean(props.uid) && Boolean(props.modelClassName);
};

/**
 * FlowsFloatContextMenu组件 - 悬浮配置图标组件
 *
 * 功能特性：
 * - 鼠标悬浮显示右上角配置图标
 * - 点击图标显示配置菜单
 * - 支持删除功能
 * - Wrapper 模式支持
 * - 使用与 NocoBase x-settings 一致的样式
 * - 按flow分组显示steps
 *
 * 支持两种使用方式：
 * 1. 直接提供model: <FlowsFloatContextMenu model={myModel}>{children}</FlowsFloatContextMenu>
 * 2. 通过uid和modelClassName获取model: <FlowsFloatContextMenu uid="model1" modelClassName="MyModel">{children}</FlowsFloatContextMenu>
 *
 * @param props.children 子组件，必须提供
 * @param props.enabled 是否启用悬浮菜单，默认为true
 * @param props.showDeleteButton 是否显示删除按钮，默认为true
 * @param props.showCopyUidButton 是否显示复制UID按钮，默认为true
 * @param props.containerStyle 容器自定义样式
 * @param props.className 容器自定义类名
 * @param props.showTitle 是否在边框左上角显示模型title，默认为false
 * @param props.settingsMenuLevel 设置菜单层级：1=仅当前模型(默认)，2=包含子模型
 * @param props.extraToolbarItems 额外的工具栏项目，仅应用于此实例
 */
const FlowsFloatContextMenu: React.FC<FlowsFloatContextMenuProps> = observer((props) => {
  const ctx = useFlowContext();
  // Only render if flowSettings is enabled
  if (!ctx.flowSettingsEnabled) {
    return <>{props.children}</>;
  }
  if (isModelByIdProps(props)) {
    return <FlowsFloatContextMenuWithModelById {...props} />;
  } else {
    return <FlowsFloatContextMenuWithModel {...props} />;
  }
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

  // 拖拽移动处理函数
  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current || !dragTypeRef.current) return;

      const deltaX = e.clientX - dragStartPosRef.current.x;
      const deltaY = e.clientY - dragStartPosRef.current.y;

      let resizeDistance = 0;

      switch (dragTypeRef.current) {
        case 'left':
          // 左侧把手：向左拖为正数，向右拖为负数
          resizeDistance = -deltaX;
          props.model.parent.emitter.emit('onResizeLeft', { resizeDistance, model: props.model });
          break;

        case 'right':
          // 右侧把手：向右拖为正数，向左拖为负数
          resizeDistance = deltaX;
          props.model.parent.emitter.emit('onResizeRight', { resizeDistance, model: props.model });
          break;

        case 'bottom':
          // 底部把手：向下拖为正数，向上拖为负数
          resizeDistance = deltaY;
          props.model.parent.emitter.emit('onResizeBottom', { resizeDistance, model: props.model });
          break;

        case 'corner': {
          // 右下角把手：同时计算宽度和高度变化
          const widthDelta = deltaX;
          const heightDelta = deltaY;
          props.model.parent.emitter.emit('onResizeCorner', { widthDelta, heightDelta, model: props.model });
          break;
        }
      }
    },
    [props.model],
  );

  // 拖拽结束处理函数
  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    dragTypeRef.current = null;
    dragStartPosRef.current = { x: 0, y: 0 };

    // 移除全局事件监听
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);

    props.model.parent.emitter.emit('onResizeEnd');
    onDragEnd?.();
  }, [handleDragMove, props.model, onDragEnd]);

  // 拖拽开始处理函数
  const handleDragStart = useCallback(
    (e: React.MouseEvent, type: 'left' | 'right' | 'bottom' | 'corner') => {
      e.preventDefault();
      e.stopPropagation();

      isDraggingRef.current = true;
      dragTypeRef.current = type;
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };

      // 添加全局事件监听
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);

      onDragStart?.();
    },
    [handleDragMove, handleDragEnd, onDragStart],
  );

  return (
    <>
      {/* 拖拽把手 */}
      <div
        className="resize-handle resize-handle-left"
        title="拖拽调节宽度"
        onMouseEnter={props.onMouseEnter}
        onMouseLeave={props.onMouseLeave}
        onMouseDown={(e) => handleDragStart(e, 'left')}
      ></div>
      <div
        className="resize-handle resize-handle-right"
        title="拖拽调节宽度"
        onMouseEnter={props.onMouseEnter}
        onMouseLeave={props.onMouseLeave}
        onMouseDown={(e) => handleDragStart(e, 'right')}
      ></div>
      {/* <div
            className="resize-handle resize-handle-bottom"
            title="拖拽调节高度"
            onMouseDown={(e) => handleDragStart(e, 'bottom')}
          ></div> */}
    </>
  );
};

// 使用传入的model
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
    toolbarRenderMode = 'portal',
  }: ModelProvidedProps) => {
    const [hideMenu, setHideMenu] = useState<boolean>(false);
    const [hasButton, setHasButton] = useState<boolean>(false);
    const [isHostHovered, setIsHostHovered] = useState<boolean>(false);
    const [isToolbarHovered, setIsToolbarHovered] = useState<boolean>(false);
    const [isDraggingToolbar, setIsDraggingToolbar] = useState<boolean>(false);
    const [portalRect, setPortalRect] = useState<{ top: number; left: number; width: number; height: number }>({
      top: 0,
      left: 0,
      width: 0,
      height: 0,
    });
    const containerRef = useRef<HTMLDivElement>(null);
    const flowEngine = useFlowEngine();
    const toolbarContainerRef = useRef<HTMLDivElement>(null);
    const portalRafIdRef = useRef<number | null>(null);
    const toolbarRenderModeValue: ToolbarRenderMode =
      toolbarRenderMode === 'inline' || typeof document === 'undefined' ? 'inline' : 'portal';
    const isToolbarVisible = !hideMenu && (isHostHovered || isToolbarHovered || isDraggingToolbar);
    const toolbarCount = getToolbarCount(model, flowEngine, extraToolbarItems);
    const toolbarItems = useMemo(
      () =>
        renderToolbarItems(
          model,
          showDeleteButton,
          showCopyUidButton,
          flowEngine,
          settingsMenuLevel,
          extraToolbarItems,
        ),
      [model, showDeleteButton, showCopyUidButton, flowEngine, settingsMenuLevel, extraToolbarItems],
    );

    const updatePortalRect = useCallback(() => {
      if (!containerRef.current || toolbarRenderModeValue !== 'portal') {
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const nextRect = {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      };

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
    }, [toolbarRenderModeValue]);

    const schedulePortalRectUpdate = useCallback(() => {
      if (toolbarRenderModeValue !== 'portal' || portalRafIdRef.current !== null) {
        return;
      }

      portalRafIdRef.current = window.requestAnimationFrame(() => {
        portalRafIdRef.current = null;
        updatePortalRect();
      });
    }, [toolbarRenderModeValue, updatePortalRect]);

    useEffect(() => {
      if (toolbarRenderModeValue === 'portal') {
        updatePortalRect();
      }
    }, [toolbarRenderModeValue, updatePortalRect]);

    useEffect(() => {
      if (toolbarRenderModeValue !== 'portal' || !isToolbarVisible) {
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

      window.addEventListener('resize', handleViewportChange);
      window.addEventListener('scroll', handleViewportChange, true);

      return () => {
        resizeObserver?.disconnect();
        window.removeEventListener('resize', handleViewportChange);
        window.removeEventListener('scroll', handleViewportChange, true);
      };
    }, [isToolbarVisible, schedulePortalRectUpdate, toolbarRenderModeValue, updatePortalRect]);

    useEffect(() => {
      return () => {
        if (portalRafIdRef.current !== null) {
          window.cancelAnimationFrame(portalRafIdRef.current);
        }
      };
    }, []);

    // 检测DOM中是否包含button元素
    useEffect(() => {
      if (containerRef.current) {
        const hasButtonElement = detectButtonInDOM(containerRef.current);
        setHasButton(hasButtonElement);
      }
    }, [children]); // 当children变化时重新检测

    // 使用MutationObserver监听DOM变化
    useEffect(() => {
      if (!containerRef.current) return;

      const observer = new MutationObserver(() => {
        if (containerRef.current) {
          const hasButtonElement = detectButtonInDOM(containerRef.current);
          setHasButton(hasButtonElement);
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

      // 如果悬浮的是子元素（且不是当前容器），则隐藏当前菜单
      if (childWithMenu && childWithMenu !== containerRef.current) {
        setHideMenu(true);
      } else {
        setHideMenu(false);
      }
    }, []);

    const handleHostMouseEnter = useCallback(() => {
      setHideMenu(false);
      setIsHostHovered(true);
      schedulePortalRectUpdate();
    }, [schedulePortalRectUpdate]);

    const handleHostMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      setIsHostHovered(false);
      if (isNodeWithin(e.relatedTarget, toolbarContainerRef.current)) {
        setIsToolbarHovered(true);
      }
      if (!isNodeWithin(e.relatedTarget, toolbarContainerRef.current)) {
        setHideMenu(false);
      }
    }, []);

    const handleToolbarMouseEnter = useCallback(() => {
      setIsToolbarHovered(true);
      schedulePortalRectUpdate();
    }, [schedulePortalRectUpdate]);

    const handleToolbarMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      setIsToolbarHovered(false);
      if (isNodeWithin(e.relatedTarget, containerRef.current)) {
        setIsHostHovered(true);
      }
      if (!isNodeWithin(e.relatedTarget, containerRef.current)) {
        setHideMenu(false);
      }
    }, []);

    if (!model) {
      const t = getT(model || ({} as FlowModel));
      return <Alert message={t('Invalid model provided')} type="error" />;
    }

    // 如果未启用或没有children，直接返回children
    if (!enabled || !children) {
      return <>{children}</>;
    }

    const toolbarContainerClassName = [
      toolbarContainerStyles({ showBackground, showBorder, ctx: model.context }),
      toolbarRenderModeValue === 'portal' ? 'nb-toolbar-portal' : 'nb-toolbar-inline',
      isToolbarVisible ? 'nb-toolbar-visible' : '',
      className?.includes('nb-in-template') ? 'nb-in-template' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const toolbarContainerStyle = {
      ...(toolbarRenderModeValue === 'portal'
        ? {
            top: `${portalRect.top}px`,
            left: `${portalRect.left}px`,
            width: `${portalRect.width}px`,
            height: `${portalRect.height}px`,
          }
        : {
            minWidth: `${TOOLBAR_ITEM_WIDTH * toolbarCount}px`,
          }),
      ...toolbarStyle,
    } satisfies React.CSSProperties;

    const toolbarNode = (
      <div
        ref={toolbarContainerRef}
        className={`nb-toolbar-container ${toolbarContainerClassName}`}
        style={toolbarContainerStyle}
        data-model-uid={model.uid}
        data-toolbar-position={toolbarPosition}
        data-toolbar-render-mode={toolbarRenderModeValue}
        data-toolbar-visible={isToolbarVisible ? 'true' : 'false'}
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
        {toolbarRenderModeValue === 'portal' ? createPortal(toolbarNode, document.body) : toolbarNode}
      </div>
    );
  },
  {
    displayName: 'FlowsFloatContextMenuWithModel',
  },
);

// 通过useModelById hook获取model
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
    extraToolbarItems: extraToolbarItems,
    toolbarPosition,
    toolbarRenderMode,
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
        toolbarRenderMode={toolbarRenderMode}
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

function getToolbarCount(model: FlowModel, flowEngine: FlowEngine, extraToolbarItems?: ToolbarItemConfig[]) {
  const toolbarItems = flowEngine?.flowSettings?.getToolbarItems?.() || [];
  const allToolbarItems = [...toolbarItems, ...(extraToolbarItems || [])];
  return allToolbarItems.filter((itemConfig: ToolbarItemConfig) => {
    return itemConfig.visible ? itemConfig.visible(model) : true;
  }).length;
}
