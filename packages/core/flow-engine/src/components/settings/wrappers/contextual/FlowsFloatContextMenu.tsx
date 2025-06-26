/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Alert, Space } from 'antd';
import { observer } from '@formily/react';
import { css } from '@emotion/css';
import { FlowModel } from '../../../../models';
import { ToolbarItemConfig } from '../../../../types';
import { useFlowModelById } from '../../../../hooks';
import { useFlowEngine } from '../../../../provider';
import { FlowEngine } from '../../../../flowEngine';

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
  extralToolbarItems?: ToolbarItemConfig[],
) => {
  const toolbarItems = flowEngine?.flowSettings?.getToolbarItems?.() || [];

  // 合并额外的工具栏项目
  const allToolbarItems = [...toolbarItems, ...(extralToolbarItems || [])];

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

// 使用与 NocoBase 一致的悬浮工具栏样式
const floatContainerStyles = ({ showBackground, showBorder }) => css`
  position: relative;
  display: inline;

  /* 当检测到button时使用inline-block */
  &.has-button-child {
    display: inline-block;
  }

  /* 正常的hover行为 */
  &:hover > .general-schema-designer {
    display: block;
  }

  /* 当有.hide-parent-menu类时隐藏菜单 */
  &.hide-parent-menu > .general-schema-designer {
    display: none !important;
  }

  > .general-schema-designer {
    position: absolute;
    z-index: 999;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: none;
    background: ${showBackground ? 'var(--colorBgSettingsHover)' : ''};
    border: ${showBorder ? '2px solid var(--colorBorderSettingsHover)' : ''};
    pointer-events: none;

    &.nb-in-template {
      background: var(--colorTemplateBgSettingsHover);
    }

    > .general-schema-designer-icons {
      position: absolute;
      right: 2px;
      top: 2px;
      line-height: 16px;
      pointer-events: all;

      .ant-space-item {
        background-color: var(--colorSettings);
        color: #fff;
        line-height: 16px;
        width: 16px;
        height: 16px;
        padding: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }
`;

// 悬浮右键菜单组件接口
interface ModelProvidedProps {
  model: FlowModel;
  children?: React.ReactNode;
  enabled?: boolean;
  showDeleteButton?: boolean;
  showCopyUidButton?: boolean;
  containerStyle?: React.CSSProperties;
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
   * Settings menu levels: 1=current model only (default), 2=include sub-models
   */
  settingsMenuLevel?: number;
  /**
   * Extra toolbar items to add to this context menu instance
   */
  extralToolbarItems?: ToolbarItemConfig[];
}

interface ModelByIdProps {
  uid: string;
  modelClassName: string;
  children?: React.ReactNode;
  enabled?: boolean;
  showDeleteButton?: boolean;
  showCopyUidButton?: boolean;
  containerStyle?: React.CSSProperties;
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
   * Settings menu levels: 1=current model only (default), 2=include sub-models
   */
  settingsMenuLevel?: number;
  /**
   * Extra toolbar items to add to this context menu instance
   */
  extralToolbarItems?: ToolbarItemConfig[];
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
 * @param props.settingsMenuLevel 设置菜单层级：1=仅当前模型(默认)，2=包含子模型
 * @param props.extralToolbarItems 额外的工具栏项目，仅应用于此实例
 */
const FlowsFloatContextMenu: React.FC<FlowsFloatContextMenuProps> = observer((props) => {
  const flowEngine = useFlowEngine();
  // Only render if flowSettings is enabled
  if (!flowEngine.flowSettings?.enabled) {
    return <>{props.children}</>;
  }
  if (isModelByIdProps(props)) {
    return <FlowsFloatContextMenuWithModelById {...props} />;
  } else {
    return <FlowsFloatContextMenuWithModel {...props} />;
  }
});

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
    settingsMenuLevel,
    extralToolbarItems,
  }: ModelProvidedProps) => {
    const [hideMenu, setHideMenu] = useState<boolean>(false);
    const [hasButton, setHasButton] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const flowEngine = useFlowEngine();

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

    if (!model) {
      return <Alert message="提供的模型无效" type="error" />;
    }

    // 如果未启用或没有children，直接返回children
    if (!enabled || !children) {
      return <>{children}</>;
    }

    return (
      <div
        ref={containerRef}
        className={`${floatContainerStyles({ showBackground, showBorder })} ${hideMenu ? 'hide-parent-menu' : ''} ${
          hasButton ? 'has-button-child' : ''
        } ${className || ''}`}
        style={containerStyle}
        data-has-float-menu="true"
        onMouseMove={handleChildHover}
      >
        {children}

        {/* 悬浮工具栏 - 使用与 NocoBase 一致的结构 */}
        <div className="general-schema-designer">
          <div className="general-schema-designer-icons">
            <Space size={3} align="center">
              {renderToolbarItems(
                model,
                showDeleteButton,
                showCopyUidButton,
                flowEngine,
                settingsMenuLevel,
                extralToolbarItems,
              )}
            </Space>
          </div>
        </div>
      </div>
    );
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
    settingsMenuLevel,
    extralToolbarItems,
  }) => {
    const model = useFlowModelById(uid, modelClassName);

    if (!model) {
      return <Alert message={`未找到ID为 ${uid} 的模型`} type="error" />;
    }

    return (
      <FlowsFloatContextMenuWithModel
        model={model}
        enabled={enabled}
        showDeleteButton={showDeleteButton}
        showCopyUidButton={showCopyUidButton}
        containerStyle={containerStyle}
        className={className}
        settingsMenuLevel={settingsMenuLevel}
        extralToolbarItems={extralToolbarItems}
      >
        {children}
      </FlowsFloatContextMenuWithModel>
    );
  },
);

export { FlowsFloatContextMenu };
