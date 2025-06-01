/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@formily/reactive-react';
import React from 'react';
import { useApplyAutoFlows, useFlowContext } from '../hooks';
import { FlowModel } from '../models';
import { FlowsFloatContextMenu } from './settings/wrappers/contextual/FlowsFloatContextMenu';
import { FlowsContextMenu } from './settings/wrappers/contextual/FlowsContextMenu';

interface FlowModelRendererProps {
  model?: FlowModel;
  uid?: string;

  /** 是否显示流程设置入口（如按钮、菜单等） */
  showFlowSettings?: boolean; // 默认 false

  /** 流程设置的交互风格 */
  flowSettingsVariant?: 'dropdown' | 'contextMenu' | 'modal' | 'drawer'; // 默认 'dropdown'
}

/**
 * A React component responsible for rendering a FlowModel.
 * It delegates the actual rendering logic to the `render` method of the provided model.
 *
 * @param {FlowModelRendererProps} props - The component's props.
 * @param {FlowModel} props.model - The FlowModel instance to render.
 * @param {string} props.uid - The unique identifier for the flow model.
 * @param {boolean} props.showFlowSettings - Whether to show flow settings entry (buttons, menus, etc.).
 * @param {string} props.flowSettingsVariant - The interaction style for flow settings.
 * @returns {React.ReactNode | null} The rendered output of the model, or null if the model or its render method is invalid.
 */
export const FlowModelRenderer: React.FC<FlowModelRendererProps> = observer(
  ({ model, uid, showFlowSettings = false, flowSettingsVariant = 'dropdown' }) => {
    const flowContext = useFlowContext();
    useApplyAutoFlows(model, flowContext);

    if (!model || typeof model.render !== 'function') {
      // 可以选择渲染 null 或者一个错误/提示信息
      console.warn('FlowModelRenderer: Invalid model or render method not found.', model);
      return null;
    }

    // 渲染模型内容
    const modelContent = model.render();

    // 如果不显示流程设置，直接返回模型内容
    if (!showFlowSettings) {
      return modelContent;
    }

    // 根据 flowSettingsVariant 包装相应的设置组件
    switch (flowSettingsVariant) {
      case 'dropdown':
        return <FlowsFloatContextMenu model={model}>{modelContent}</FlowsFloatContextMenu>;

      case 'contextMenu':
        return <FlowsContextMenu model={model}>{modelContent}</FlowsContextMenu>;

      case 'modal':
        // TODO: 实现 modal 模式的流程设置
        console.warn('FlowModelRenderer: modal variant is not implemented yet');
        return modelContent;

      case 'drawer':
        // TODO: 实现 drawer 模式的流程设置
        console.warn('FlowModelRenderer: drawer variant is not implemented yet');
        return modelContent;

      default:
        console.warn(
          `FlowModelRenderer: Unknown flowSettingsVariant '${flowSettingsVariant}', falling back to dropdown`,
        );
        return <FlowsFloatContextMenu model={model}>{modelContent}</FlowsFloatContextMenu>;
    }
  },
);
