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
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { FlowModelProvider, useApplyAutoFlows } from '../hooks';
import { getAutoFlowError, setAutoFlowError } from '../utils';
import { FlowModel } from '../models';
import { ToolbarItemConfig } from '../types';
import { FlowErrorFallback } from './FlowErrorFallback';
import { FlowsContextMenu } from './settings/wrappers/contextual/FlowsContextMenu';
import { FlowsFloatContextMenu } from './settings/wrappers/contextual/FlowsFloatContextMenu';

export interface FlowSettingsRenderConfig {
  /**
   * 是否显示流程设置入口：
   * - 当 `showFlowSettings` 为对象时，默认 `true`
   * - 可以通过 `enabled: false` 显式关闭
   */
  enabled?: boolean;
  /**
   * 是否将「是否开启」状态递归传递给子级 `FlowModelRenderer`
   * - 仅影响 enabled 的继承，不继承其它配置（如 showBorder/style 等）
   */
  recursive?: boolean;
  showBackground?: boolean;
  showBorder?: boolean;
  showDragHandle?: boolean;
  /** 自定义工具栏样式 */
  style?: React.CSSProperties;
  /**
   * @default 'inside'
   */
  toolbarPosition?: 'inside' | 'above' | 'below';
}

const FlowSettingsRecursiveContext = createContext<boolean | null>(null);

function isFlowSettingsConfig(
  value: boolean | FlowSettingsRenderConfig | undefined,
): value is FlowSettingsRenderConfig {
  return typeof value === 'object' && value !== null;
}

interface ResolvedFlowSettings {
  resolved: boolean | FlowSettingsRenderConfig;
  nextContext: boolean | null;
}

/**
 * 处理 showFlowSettings 的继承逻辑
 * - 支持从父级 recursive 继承 enabled 状态
 * - 显式设置的值优先于继承值
 */
function useResolvedFlowSettings(
  showFlowSettings: boolean | FlowSettingsRenderConfig | undefined,
): ResolvedFlowSettings {
  const inherited = useContext(FlowSettingsRecursiveContext);

  return useMemo(() => {
    const isConfig = isFlowSettingsConfig(showFlowSettings);
    const hasExplicit = showFlowSettings !== undefined;

    // 计算当前节点的 enabled 状态
    let enabled: boolean;
    if (hasExplicit) {
      enabled = isConfig ? showFlowSettings.enabled ?? true : !!showFlowSettings;
    } else {
      enabled = inherited ?? false;
    }

    // 计算传递给子级的 context
    const recursive = isConfig && showFlowSettings.recursive;
    const nextContext: boolean | null = recursive ? enabled : inherited;

    // 计算最终传递给子组件的 showFlowSettings 值
    const resolved: boolean | FlowSettingsRenderConfig =
      enabled && isConfig && hasExplicit ? showFlowSettings : enabled;

    return { resolved, nextContext };
  }, [showFlowSettings, inherited]);
}

export interface FlowModelRendererProps {
  model?: FlowModel;
  uid?: string;

  fallback?: React.ReactNode; // beforeRender 执行期间的回退内容（如 loading 占位）

  key?: React.Key;

  /** 是否显示流程设置入口（如按钮、菜单等） */
  showFlowSettings?: boolean | FlowSettingsRenderConfig;

  /** 流程设置的交互风格 */
  flowSettingsVariant?: 'dropdown' | 'contextMenu' | 'modal' | 'drawer'; // 默认 'dropdown'

  /** 是否在设置中隐藏移除按钮 */
  hideRemoveInSettings?: boolean; // 默认 false

  /** 是否在边框左上角显示模型title，默认 false */
  showTitle?: boolean; // 默认 false

  /** 传递给 beforeRender 事件的运行时参数 */
  inputArgs?: Record<string, any>;

  /** 是否在最外层包装 FlowErrorFallback 组件，默认 true */
  showErrorFallback?: boolean; // 默认 true

  /** 设置菜单层级：1=仅当前模型(默认)，2=包含子模型 */
  settingsMenuLevel?: number;

  /** 额外的工具栏项目，仅应用于此实例 */
  extraToolbarItems?: ToolbarItemConfig[];

  useCache?: boolean;
}

/**
 * 内部组件：带有 useApplyAutoFlows 的渲染器
 */
const FlowModelRendererWithAutoFlows: React.FC<{
  model: FlowModel;
  showFlowSettings: boolean | FlowSettingsRenderConfig;
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

    const { loading: pending, error: autoFlowsError } = useApplyAutoFlows(model, inputArgs, {
      throwOnError: false,
      useCache: model.context.useCache,
    });
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

// 移除不带 beforeRender 执行的渲染器，统一触发 beforeRender 事件

/**
 * 核心渲染逻辑组件
 */
const FlowModelRendererCore: React.FC<{
  model: FlowModel;
  showFlowSettings: boolean | FlowSettingsRenderConfig;
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
        // 将 beforeRender 事件错误转化为内容区错误，由内层边界兜住
        throw autoError;
      }
      const rendered = model.render();
      // RenderFunction 模式：render 返回函数，作为组件类型渲染，避免函数作为子节点的警告
      if (typeof rendered === 'function') {
        return React.createElement(rendered as React.ComponentType<any>);
      }
      return <>{rendered}</>;
    };

    // 如果不显示流程设置，直接返回模型内容（可能包装 ErrorBoundary）
    // 当模型类或 use 变化时重挂载内容，规避组件内部状态残留
    const rawUse = (model as any)?.use;
    const resolvedName = (model as any)?.constructor?.name || model.uid;
    const contentKey = typeof rawUse === 'string' ? `${rawUse}:${model.uid}` : `${resolvedName}:${model.uid}`;

    if (!showFlowSettings) {
      return wrapWithErrorBoundary(
        <div key={contentKey}>
          <ContentOrError />
        </div>,
      );
    }

    // 根据 flowSettingsVariant 包装相应的设置组件
    const config = isFlowSettingsConfig(showFlowSettings) ? showFlowSettings : undefined;

    switch (flowSettingsVariant) {
      case 'dropdown':
        return (
          <FlowsFloatContextMenu
            showTitle={showTitle}
            model={model}
            showDeleteButton={!hideRemoveInSettings}
            showBackground={config?.showBackground}
            showBorder={config?.showBorder}
            showDragHandle={config?.showDragHandle}
            settingsMenuLevel={settingsMenuLevel}
            extraToolbarItems={extraToolbarItems}
            toolbarStyle={config?.style}
            toolbarPosition={config?.toolbarPosition}
          >
            {wrapWithErrorBoundary(
              <div key={contentKey}>
                <ContentOrError />
              </div>,
            )}
          </FlowsFloatContextMenu>
        );

      case 'contextMenu':
        return (
          <FlowsContextMenu model={model} showDeleteButton={!hideRemoveInSettings}>
            {wrapWithErrorBoundary(
              <div key={contentKey}>
                <ContentOrError />
              </div>,
            )}
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
            showBackground={config?.showBackground}
            showBorder={config?.showBorder}
            showDragHandle={config?.showDragHandle}
            settingsMenuLevel={settingsMenuLevel}
            extraToolbarItems={extraToolbarItems}
            toolbarStyle={config?.style}
            toolbarPosition={config?.toolbarPosition}
          >
            {wrapWithErrorBoundary(
              <div key={contentKey}>
                <ContentOrError />
              </div>,
            )}
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
 * @param {React.ReactNode} props.fallback - Fallback content while running beforeRender (loading state).
 * @param {boolean | FlowSettingsRenderConfig} props.showFlowSettings - Whether to show flow settings entry (buttons, menus, etc.).
 * @param {string} props.flowSettingsVariant - The interaction style for flow settings.
 * @param {boolean} props.hideRemoveInSettings - Whether to hide remove button in settings.
 * @param {boolean} props.showTitle - Whether to show model title in the top-left corner of the border.
 * @param {any} props.inputArgs - Runtime arguments to pass to beforeRender event flows.
 * @param {boolean} props.showErrorFallback - Whether to wrap with FlowErrorFallback ErrorBoundary.
 * @param {number} props.settingsMenuLevel - Settings menu levels: 1=current model only (default), 2=include sub-models.
 * @param {ToolbarItemConfig[]} props.extraToolbarItems - Extra toolbar items to add to this renderer instance.
 * @returns {React.ReactNode | null} The rendered output of the model, or null if the model or its render method is invalid.
 */
export const FlowModelRenderer: React.FC<FlowModelRendererProps> = observer(
  ({
    model,
    fallback = null,
    showFlowSettings,
    flowSettingsVariant = 'dropdown',
    hideRemoveInSettings = false,
    showTitle = false,
    inputArgs,
    showErrorFallback = true,
    settingsMenuLevel,
    extraToolbarItems,
    useCache,
  }) => {
    // Hooks must be called unconditionally before any early returns
    const { resolved, nextContext } = useResolvedFlowSettings(showFlowSettings);

    useEffect(() => {
      if (model?.context) {
        model.context.defineProperty('useCache', {
          value: typeof useCache === 'boolean' ? useCache : model.context.useCache,
        });
      }
    }, [model?.context, useCache]);

    if (!model || typeof model.render !== 'function') {
      console.warn('FlowModelRenderer: Invalid model or render method not found.', model);
      return null;
    }

    const content = (
      <FlowModelRendererWithAutoFlows
        model={model}
        showFlowSettings={resolved}
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

    if (showErrorFallback) {
      return (
        <FlowSettingsRecursiveContext.Provider value={nextContext}>
          <FlowModelProvider model={model}>
            <ErrorBoundary FallbackComponent={FlowErrorFallback}>{content}</ErrorBoundary>
          </FlowModelProvider>
        </FlowSettingsRecursiveContext.Provider>
      );
    }

    return <FlowSettingsRecursiveContext.Provider value={nextContext}>{content}</FlowSettingsRecursiveContext.Provider>;
  },
);

// 为需要进一步优化渲染的场景提供一个 Memo 包装版本
// 仅在父级重渲且 props 浅比较未变时跳过渲染；不影响内部响应式更新
export const MemoFlowModelRenderer = React.memo(FlowModelRenderer);
MemoFlowModelRenderer.displayName = 'MemoFlowModelRenderer';
