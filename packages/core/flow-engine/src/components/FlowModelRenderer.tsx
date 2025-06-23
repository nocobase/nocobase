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
import { useApplyAutoFlows, useFlowExtraContext } from '../hooks';
import { FlowModel } from '../models';
import { FlowsContextMenu } from './settings/wrappers/contextual/FlowsContextMenu';
import { FlowsFloatContextMenu } from './settings/wrappers/contextual/FlowsFloatContextMenu';

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

  /** 是否跳过自动应用流程，默认 false */
  skipApplyAutoFlows?: boolean; // 默认 false

  /** 当 skipApplyAutoFlows !== false 时，传递给 useApplyAutoFlows 的额外上下文 */
  extraContext?: Record<string, any>;

  /** Model 共享运行上下文，会沿着 model 树向下传递 */
  sharedContext?: Record<string, any>;

  /** 是否为每个组件独立执行 auto flow，默认 false */
  independentAutoFlowExecution?: boolean; // 默认 false
}

/**
 * 内部组件：带有 useApplyAutoFlows 的渲染器
 */
const FlowModelRendererWithAutoFlows: React.FC<{
  model: FlowModel;
  showFlowSettings: boolean | { showBackground?: boolean; showBorder?: boolean };
  flowSettingsVariant: string;
  hideRemoveInSettings: boolean;
  extraContext?: Record<string, any>;
  sharedContext?: Record<string, any>;
  independentAutoFlowExecution?: boolean;
}> = observer(
  ({
    model,
    showFlowSettings,
    flowSettingsVariant,
    hideRemoveInSettings,
    extraContext,
    sharedContext,
    independentAutoFlowExecution,
  }) => {
    const defaultExtraContext = useFlowExtraContext();
    useApplyAutoFlows(model, extraContext || defaultExtraContext, !independentAutoFlowExecution);

    return (
      <FlowModelRendererCore
        model={model}
        showFlowSettings={showFlowSettings}
        flowSettingsVariant={flowSettingsVariant}
        hideRemoveInSettings={hideRemoveInSettings}
      />
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
  sharedContext?: Record<string, any>;
}> = observer(({ model, showFlowSettings, flowSettingsVariant, hideRemoveInSettings, sharedContext }) => {
  return (
    <FlowModelRendererCore
      model={model}
      showFlowSettings={showFlowSettings}
      flowSettingsVariant={flowSettingsVariant}
      hideRemoveInSettings={hideRemoveInSettings}
    />
  );
});

/**
 * 核心渲染逻辑组件
 */
const FlowModelRendererCore: React.FC<{
  model: FlowModel;
  showFlowSettings: boolean | { showBackground?: boolean; showBorder?: boolean };
  flowSettingsVariant: string;
  hideRemoveInSettings: boolean;
}> = observer(({ model, showFlowSettings, flowSettingsVariant, hideRemoveInSettings }) => {
  // 渲染模型内容
  const modelContent = model.render();

  // 如果不显示流程设置，直接返回模型内容
  if (!showFlowSettings) {
    return modelContent;
  }

  // 根据 flowSettingsVariant 包装相应的设置组件
  switch (flowSettingsVariant) {
    case 'dropdown':
      return (
        <FlowsFloatContextMenu
          model={model}
          showDeleteButton={!hideRemoveInSettings}
          showBackground={_.isObject(showFlowSettings) ? showFlowSettings.showBackground : undefined}
          showBorder={_.isObject(showFlowSettings) ? showFlowSettings.showBorder : undefined}
        >
          {modelContent}
        </FlowsFloatContextMenu>
      );

    case 'contextMenu':
      return (
        <FlowsContextMenu model={model} showDeleteButton={!hideRemoveInSettings}>
          {modelContent}
        </FlowsContextMenu>
      );

    case 'modal':
      // TODO: 实现 modal 模式的流程设置
      console.warn('FlowModelRenderer: modal variant is not implemented yet');
      return modelContent;

    case 'drawer':
      // TODO: 实现 drawer 模式的流程设置
      console.warn('FlowModelRenderer: drawer variant is not implemented yet');
      return modelContent;

    default:
      console.warn(`FlowModelRenderer: Unknown flowSettingsVariant '${flowSettingsVariant}', falling back to dropdown`);
      return (
        <FlowsFloatContextMenu
          model={model}
          showDeleteButton={!hideRemoveInSettings}
          showBackground={_.isObject(showFlowSettings) ? showFlowSettings.showBackground : undefined}
          showBorder={_.isObject(showFlowSettings) ? showFlowSettings.showBorder : undefined}
        >
          {modelContent}
        </FlowsFloatContextMenu>
      );
  }
});

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
 * @param {boolean} props.skipApplyAutoFlows - Whether to skip applying auto flows.
 * @param {any} props.extraContext - Extra context to pass to useApplyAutoFlows when skipApplyAutoFlows is false.
 * @param {any} props.sharedContext - Shared context to pass to the model.
 * @param {boolean} props.independentAutoFlowExecution - Whether each component has independent auto flow execution.
 * @returns {React.ReactNode | null} The rendered output of the model, or null if the model or its render method is invalid.
 */
export const FlowModelRenderer: React.FC<FlowModelRendererProps> = observer(
  ({
    model,
    fallback = <Spin />,
    showFlowSettings = false,
    flowSettingsVariant = 'dropdown',
    hideRemoveInSettings = false,
    skipApplyAutoFlows = false,
    extraContext,
    sharedContext,
    independentAutoFlowExecution = false,
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
        <Suspense fallback={<Spin />}>
          <FlowModelRendererWithoutAutoFlows
            model={model}
            showFlowSettings={showFlowSettings}
            flowSettingsVariant={flowSettingsVariant}
            hideRemoveInSettings={hideRemoveInSettings}
            sharedContext={sharedContext}
          />
        </Suspense>
      );
    } else {
      return (
        <Suspense fallback={fallback}>
          <FlowModelRendererWithAutoFlows
            model={model}
            showFlowSettings={showFlowSettings}
            flowSettingsVariant={flowSettingsVariant}
            hideRemoveInSettings={hideRemoveInSettings}
            extraContext={extraContext}
            sharedContext={sharedContext}
            independentAutoFlowExecution={independentAutoFlowExecution}
          />
        </Suspense>
      );
    }
  },
);
