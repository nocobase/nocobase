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
import { Skeleton, Spin } from 'antd';
import _ from 'lodash';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { FlowModelProvider, useApplyAutoFlows } from '../hooks';
import { getAutoFlowError, setAutoFlowError } from '../utils';
import { FlowModel } from '../models';
import { ToolbarItemConfig } from '../types';
import { FlowErrorFallback } from './FlowErrorFallback';
import { FlowsContextMenu } from './settings/wrappers/contextual/FlowsContextMenu';
import { FlowsFloatContextMenu } from './settings/wrappers/contextual/FlowsFloatContextMenu';

export interface FlowModelRendererProps {
  model?: FlowModel;
  uid?: string;

  fallback?: React.ReactNode; // 渲染失败时的回退内容

  key?: React.Key;

  /** 是否显示流程设置入口（如按钮、菜单等） */
  showFlowSettings?:
    | boolean
    | {
        showBackground?: boolean;
        showBorder?: boolean;
        showDragHandle?: boolean;
        /**
         * @default 'inside'
         */
        toolbarPosition?: 'inside' | 'above';
      }; // 默认 false

  /** 流程设置的交互风格 */
  flowSettingsVariant?: 'dropdown' | 'contextMenu' | 'modal' | 'drawer'; // 默认 'dropdown'

  /** 是否在设置中隐藏移除按钮 */
  hideRemoveInSettings?: boolean; // 默认 false

  /** 是否在边框左上角显示模型title，默认 false */
  showTitle?: boolean; // 默认 false

  /** 是否跳过自动应用流程，默认 false */
  skipApplyAutoFlows?: boolean; // 默认 false

  /** 当 skipApplyAutoFlows !== false 时，传递给 useApplyAutoFlows 的额外上下文 */
  inputArgs?: Record<string, any>;

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
  showFlowSettings:
    | boolean
    | {
        showBackground?: boolean;
        showBorder?: boolean;
        style?: React.CSSProperties;
        /**
         * @default 'inside'
         */
        toolbarPosition?: 'inside' | 'above';
      };
  flowSettingsVariant: string;
  hideRemoveInSettings: boolean;
  showTitle: boolean;
  inputArgs?: Record<string, any>;
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
    inputArgs,
    showErrorFallback,
    settingsMenuLevel,
    extraToolbarItems,
    fallback,
  }) => {
    // hidden 占位由模型自身处理；无需在此注入

    const { loading: pending, error: autoFlowsError } = useApplyAutoFlows(model, inputArgs, { throwOnError: false });
    // 将错误下沉到 model 实例上，供内容层读取（类型安全的 WeakMap 存储）
    setAutoFlowError(model, autoFlowsError || null);

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
  showFlowSettings:
    | boolean
    | {
        showBackground?: boolean;
        showBorder?: boolean;
        style?: React.CSSProperties;
        /**
         * @default 'inside'
         */
        toolbarPosition?: 'inside' | 'above';
      };
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
    setAutoFlowError(model, null);
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
  showFlowSettings:
    | boolean
    | {
        showBackground?: boolean;
        showBorder?: boolean;
        showDragHandle?: boolean;
        style?: React.CSSProperties;
        /**
         * @default 'inside'
         */
        toolbarPosition?: 'inside' | 'above';
      };
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
    const wrapWithErrorBoundary = (children: React.ReactNode) => {
      if (showErrorFallback) {
        return <ErrorBoundary FallbackComponent={FlowErrorFallback}>{children}</ErrorBoundary>;
      }
      return children;
    };

    const ContentOrError: React.FC = () => {
      const autoError = getAutoFlowError(model);
      if (autoError) {
        // 把自动流的错误转化为内容区错误，由内层边界兜住
        throw autoError;
      }
      const rendered = model.render();
      // RenderFunction 模式：render 返回函数，作为组件类型渲染，避免函数作为子节点的警告
      if (typeof rendered === 'function') {
        return React.createElement(rendered as any);
      }
      return <>{rendered}</>;
    };

    // 如果不显示流程设置，直接返回模型内容（可能包装 ErrorBoundary）
    if (!showFlowSettings) {
      return wrapWithErrorBoundary(<ContentOrError />);
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
            showDragHandle={_.isObject(showFlowSettings) ? showFlowSettings.showDragHandle : undefined}
            settingsMenuLevel={settingsMenuLevel}
            extraToolbarItems={extraToolbarItems}
            toolbarStyle={_.isObject(showFlowSettings) ? showFlowSettings.style : undefined}
            toolbarPosition={_.isObject(showFlowSettings) ? showFlowSettings.toolbarPosition : undefined}
          >
            {wrapWithErrorBoundary(<ContentOrError />)}
          </FlowsFloatContextMenu>
        );

      case 'contextMenu':
        return (
          <FlowsContextMenu model={model} showDeleteButton={!hideRemoveInSettings}>
            {wrapWithErrorBoundary(<ContentOrError />)}
          </FlowsContextMenu>
        );

      case 'modal':
        // TODO: 实现 modal 模式的流程设置
        console.warn('FlowModelRenderer: modal variant is not implemented yet');
        return wrapWithErrorBoundary(<ContentOrError />);

      case 'drawer':
        // TODO: 实现 drawer 模式的流程设置
        console.warn('FlowModelRenderer: drawer variant is not implemented yet');
        return wrapWithErrorBoundary(<ContentOrError />);

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
            showDragHandle={_.isObject(showFlowSettings) ? showFlowSettings.showDragHandle : undefined}
            settingsMenuLevel={settingsMenuLevel}
            extraToolbarItems={extraToolbarItems}
            toolbarStyle={_.isObject(showFlowSettings) ? showFlowSettings.style : undefined}
            toolbarPosition={_.isObject(showFlowSettings) ? showFlowSettings.toolbarPosition : undefined}
          >
            {wrapWithErrorBoundary(<ContentOrError />)}
          </FlowsFloatContextMenu>
        );
    }
  },
  {
    displayName: 'FlowModelRendererCore',
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
 * @param {any} props.inputArgs - Runtime arguments to pass to useApplyAutoFlows when skipApplyAutoFlows is false.
 * @param {number} props.settingsMenuLevel - Settings menu levels: 1=current model only (default), 2=include sub-models.
 * @param {ToolbarItemConfig[]} props.extraToolbarItems - Extra toolbar items to add to this renderer instance.
 * @returns {React.ReactNode | null} The rendered output of the model, or null if the model or its render method is invalid.
 */
export const FlowModelRenderer: React.FC<FlowModelRendererProps> = observer(
  ({
    model,
    fallback = <Skeleton.Button size="small" />,
    showFlowSettings = false,
    flowSettingsVariant = 'dropdown',
    hideRemoveInSettings = false,
    showTitle = false,
    skipApplyAutoFlows = false,
    inputArgs,
    showErrorFallback = true,
    settingsMenuLevel,
    extraToolbarItems,
  }) => {
    if (!model || typeof model.render !== 'function') {
      // 可以选择渲染 null 或者一个错误/提示信息
      console.warn('FlowModelRenderer: Invalid model or render method not found.', model);
      return null;
    }

    // 构建渲染内容
    const content = skipApplyAutoFlows ? (
      <FlowModelRendererWithoutAutoFlows
        model={model}
        showFlowSettings={showFlowSettings}
        flowSettingsVariant={flowSettingsVariant}
        hideRemoveInSettings={hideRemoveInSettings}
        showTitle={showTitle}
        showErrorFallback={showErrorFallback}
        settingsMenuLevel={settingsMenuLevel}
        extraToolbarItems={extraToolbarItems}
      />
    ) : (
      <FlowModelRendererWithAutoFlows
        model={model}
        showFlowSettings={showFlowSettings}
        flowSettingsVariant={flowSettingsVariant}
        hideRemoveInSettings={hideRemoveInSettings}
        showTitle={showTitle}
        inputArgs={inputArgs}
        showErrorFallback={showErrorFallback}
        settingsMenuLevel={settingsMenuLevel}
        extraToolbarItems={extraToolbarItems}
        fallback={fallback}
      />
    );

    // 当需要错误回退时，将整体包裹在 ErrorBoundary 和 FlowModelProvider 中
    // 这样既能捕获 useApplyAutoFlows 中抛出的错误，也能在回退组件中获取 model 上下文
    if (showErrorFallback) {
      return (
        <FlowModelProvider model={model}>
          <ErrorBoundary FallbackComponent={FlowErrorFallback}>{content}</ErrorBoundary>
        </FlowModelProvider>
      );
    }

    return content;
  },
);
