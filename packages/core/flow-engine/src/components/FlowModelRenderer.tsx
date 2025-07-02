/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 *
 * @example
 * // 基本使用
 * <FlowModelRenderer model={myModel} />
 *
 * // 显示设置但隐藏删除按钮
 * <FlowModelRenderer
 *   model={myModel}
 *   showFlowSettings={true}
 *   hideRemoveInSettings={true}
 * />
 *
 * // 显示设置和title
 * <FlowModelRenderer
 *   model={myModel}
 *   showFlowSettings={true}
 *   showTitle={true}
 * />
 *
 * // 使用右键菜单模式并隐藏删除按钮
 * <FlowModelRenderer
 *   model={myModel}
 *   showFlowSettings={true}
 *   flowSettingsVariant="contextMenu"
 *   hideRemoveInSettings={true}
 * />
 */

import { observer } from '@formily/reactive-react';
import { Spin } from 'antd';
import _ from 'lodash';
import React, { Suspense, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useApplyAutoFlows, FlowModelProvider } from '../hooks';
import { FlowModel } from '../models';
import { ToolbarItemConfig } from '../types';
import { FlowsContextMenu } from './settings/wrappers/contextual/FlowsContextMenu';
import { FlowsFloatContextMenu } from './settings/wrappers/contextual/FlowsFloatContextMenu';
import { FlowErrorFallback } from './FlowErrorFallback';

interface FlowModelRendererProps {
  model?: FlowModel;
  uid?: string;

  fallback?: React.ReactNode; // 渲染失败时的回退内容

  /** 是否显示流程设置入口（如按钮、菜单等） */
  showFlowSettings?: boolean | { showBackground?: boolean; showBorder?: boolean }; // 默认 false

  /** 流程设置的交互风格 */
  flowSettingsVariant?: 'dropdown' | 'contextMenu' | 'modal' | 'drawer'; // 默认 'dropdown'

  /** 是否在设置中隐藏移除按钮 */
  hideRemoveInSettings?: boolean; // 默认 false

  /** 是否在边框左上角显示模型title，默认 false */
  showTitle?: boolean; // 默认 false

  /** 是否跳过自动应用流程，默认 false */
  skipApplyAutoFlows?: boolean; // 默认 false

  /** 当 skipApplyAutoFlows !== false 时，传递给 useApplyAutoFlows 的额外上下文 */
  extraContext?: Record<string, any>;

  /** Model 共享运行上下文，会沿着 model 树向下传递 */
  sharedContext?: Record<string, any>;

  /** 是否在最外层包装 FlowErrorFallback 组件，默认 false */
  showErrorFallback?: boolean; // 默认 false

  /** 设置菜单层级：1=仅当前模型(默认)，2=包含子模型 */
  settingsMenuLevel?: number;

  /** 额外的工具栏项目，仅应用于此实例 */
  extraToolbarItems?: ToolbarItemConfig[];
}

/**
 * 内部组件：带有 useApplyAutoFlows 的渲染器
 */
const FlowModelRendererWithAutoFlows: React.FC<{
  model: FlowModel;
  showFlowSettings: boolean | { showBackground?: boolean; showBorder?: boolean };
  flowSettingsVariant: string;
  hideRemoveInSettings: boolean;
  showTitle: boolean;
  extraContext?: Record<string, any>;
  sharedContext?: Record<string, any>;
  showErrorFallback?: boolean;
  settingsMenuLevel?: number;
  extraToolbarItems?: ToolbarItemConfig[];
  fallback?: React.ReactNode;
}> = observer(
  ({
    model,
    showFlowSettings,
    flowSettingsVariant,
    hideRemoveInSettings,
    showTitle,
    extraContext,
    sharedContext,
    showErrorFallback,
    settingsMenuLevel,
    extraToolbarItems,
    fallback,
  }) => {
    const pending = useApplyAutoFlows(model, extraContext);

    if (pending) {
      return <>{fallback}</>;
    }

    return (
      <FlowModelProvider model={model}>
        <FlowModelRendererCore
          model={model}
          showFlowSettings={showFlowSettings}
          flowSettingsVariant={flowSettingsVariant}
          hideRemoveInSettings={hideRemoveInSettings}
          showTitle={showTitle}
          showErrorFallback={showErrorFallback}
          settingsMenuLevel={settingsMenuLevel}
          extraToolbarItems={extraToolbarItems}
        />
      </FlowModelProvider>
    );
  },
);

/**
 * 内部组件：不带 useApplyAutoFlows 的渲染器
 */
const FlowModelRendererWithoutAutoFlows: React.FC<{
  model: FlowModel;
  showFlowSettings: boolean | { showBackground?: boolean; showBorder?: boolean };
  flowSettingsVariant: string;
  hideRemoveInSettings: boolean;
  showTitle: boolean;
  sharedContext?: Record<string, any>;
  showErrorFallback?: boolean;
  settingsMenuLevel?: number;
  extraToolbarItems?: ToolbarItemConfig[];
}> = observer(
  ({
    model,
    showFlowSettings,
    flowSettingsVariant,
    hideRemoveInSettings,
    showTitle,
    sharedContext,
    showErrorFallback,
    settingsMenuLevel,
    extraToolbarItems,
  }) => {
    return (
      <FlowModelProvider model={model}>
        <FlowModelRendererCore
          model={model}
          showFlowSettings={showFlowSettings}
          flowSettingsVariant={flowSettingsVariant}
          hideRemoveInSettings={hideRemoveInSettings}
          showTitle={showTitle}
          showErrorFallback={showErrorFallback}
          settingsMenuLevel={settingsMenuLevel}
          extraToolbarItems={extraToolbarItems}
        />
      </FlowModelProvider>
    );
  },
);

/**
 * 核心渲染逻辑组件
 */
const FlowModelRendererCore: React.FC<{
  model: FlowModel;
  showFlowSettings: boolean | { showBackground?: boolean; showBorder?: boolean };
  flowSettingsVariant: string;
  hideRemoveInSettings: boolean;
  showTitle: boolean;
  showErrorFallback?: boolean;
  settingsMenuLevel?: number;
  extraToolbarItems?: ToolbarItemConfig[];
}> = observer(
  ({
    model,
    showFlowSettings,
    flowSettingsVariant,
    hideRemoveInSettings,
    showTitle,
    showErrorFallback,
    settingsMenuLevel,
    extraToolbarItems,
  }) => {
    // 渲染模型内容
    const modelContent = model.render();

    // 包装 ErrorBoundary 的辅助函数
    const wrapWithErrorBoundary = (children: React.ReactNode) => {
      if (showErrorFallback) {
        return <ErrorBoundary FallbackComponent={FlowErrorFallback}>{children}</ErrorBoundary>;
      }
      return children;
    };

    // 如果不显示流程设置，直接返回模型内容（可能包装 ErrorBoundary）
    if (!showFlowSettings) {
      return wrapWithErrorBoundary(modelContent);
    }

    // 根据 flowSettingsVariant 包装相应的设置组件
    switch (flowSettingsVariant) {
      case 'dropdown':
        return (
          <FlowsFloatContextMenu
            showTitle={showTitle}
            model={model}
            showDeleteButton={!hideRemoveInSettings}
            showBackground={_.isObject(showFlowSettings) ? showFlowSettings.showBackground : undefined}
            showBorder={_.isObject(showFlowSettings) ? showFlowSettings.showBorder : undefined}
            settingsMenuLevel={settingsMenuLevel}
            extraToolbarItems={extraToolbarItems}
          >
            {wrapWithErrorBoundary(modelContent)}
          </FlowsFloatContextMenu>
        );

      case 'contextMenu':
        return (
          <FlowsContextMenu model={model} showDeleteButton={!hideRemoveInSettings}>
            {wrapWithErrorBoundary(modelContent)}
          </FlowsContextMenu>
        );

      case 'modal':
        // TODO: 实现 modal 模式的流程设置
        console.warn('FlowModelRenderer: modal variant is not implemented yet');
        return wrapWithErrorBoundary(modelContent);

      case 'drawer':
        // TODO: 实现 drawer 模式的流程设置
        console.warn('FlowModelRenderer: drawer variant is not implemented yet');
        return wrapWithErrorBoundary(modelContent);

      default:
        console.warn(
          `FlowModelRenderer: Unknown flowSettingsVariant '${flowSettingsVariant}', falling back to dropdown`,
        );
        return (
          <FlowsFloatContextMenu
            showTitle={showTitle}
            model={model}
            showDeleteButton={!hideRemoveInSettings}
            showBackground={_.isObject(showFlowSettings) ? showFlowSettings.showBackground : undefined}
            showBorder={_.isObject(showFlowSettings) ? showFlowSettings.showBorder : undefined}
            settingsMenuLevel={settingsMenuLevel}
            extraToolbarItems={extraToolbarItems}
          >
            {wrapWithErrorBoundary(modelContent)}
          </FlowsFloatContextMenu>
        );
    }
  },
);

/**
 * A React component responsible for rendering a FlowModel.
 * It delegates the actual rendering logic to the `render` method of the provided model.
 *
 * @param {FlowModelRendererProps} props - The component's props.
 * @param {FlowModel} props.model - The FlowModel instance to render.
 * @param {string} props.uid - The unique identifier for the flow model.
 * @param {boolean} props.showFlowSettings - Whether to show flow settings entry (buttons, menus, etc.).
 * @param {string} props.flowSettingsVariant - The interaction style for flow settings.
 * @param {boolean} props.hideRemoveInSettings - Whether to hide remove button in settings.
 * @param {boolean} props.showTitle - Whether to show model title in the top-left corner of the border.
 * @param {boolean} props.skipApplyAutoFlows - Whether to skip applying auto flows.
 * @param {any} props.extraContext - Extra context to pass to useApplyAutoFlows when skipApplyAutoFlows is false.
 * @param {any} props.sharedContext - Shared context to pass to the model.
 * @param {number} props.settingsMenuLevel - Settings menu levels: 1=current model only (default), 2=include sub-models.
 * @param {ToolbarItemConfig[]} props.extraToolbarItems - Extra toolbar items to add to this renderer instance.
 * @returns {React.ReactNode | null} The rendered output of the model, or null if the model or its render method is invalid.
 */
export const FlowModelRenderer: React.FC<FlowModelRendererProps> = observer(
  ({
    model,
    fallback = <Spin />,
    showFlowSettings = false,
    flowSettingsVariant = 'dropdown',
    hideRemoveInSettings = false,
    showTitle = false,
    skipApplyAutoFlows = false,
    extraContext,
    sharedContext,
    showErrorFallback = false,
    settingsMenuLevel,
    extraToolbarItems,
  }) => {
    if (!model || typeof model.render !== 'function') {
      // 可以选择渲染 null 或者一个错误/提示信息
      console.warn('FlowModelRenderer: Invalid model or render method not found.', model);
      return null;
    }

    useEffect(() => {
      model.setSharedContext(sharedContext);
    }, [model, sharedContext]);

    // 根据 skipApplyAutoFlows 选择不同的内部组件
    if (skipApplyAutoFlows) {
      return (
        <FlowModelRendererWithoutAutoFlows
          model={model}
          showFlowSettings={showFlowSettings}
          flowSettingsVariant={flowSettingsVariant}
          hideRemoveInSettings={hideRemoveInSettings}
          showTitle={showTitle}
          sharedContext={sharedContext}
          showErrorFallback={showErrorFallback}
          settingsMenuLevel={settingsMenuLevel}
          extraToolbarItems={extraToolbarItems}
        />
      );
    } else {
      return (
        <FlowModelRendererWithAutoFlows
          model={model}
          showFlowSettings={showFlowSettings}
          flowSettingsVariant={flowSettingsVariant}
          hideRemoveInSettings={hideRemoveInSettings}
          showTitle={showTitle}
          extraContext={extraContext}
          sharedContext={sharedContext}
          showErrorFallback={showErrorFallback}
          settingsMenuLevel={settingsMenuLevel}
          extraToolbarItems={extraToolbarItems}
          fallback={fallback}
        />
      );
    }
  },
);
