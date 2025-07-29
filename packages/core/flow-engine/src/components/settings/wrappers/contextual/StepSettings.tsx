/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { message } from 'antd';
import { StepSettingsProps } from '../../../../types';
import { getT, resolveUiMode, setupRuntimeContextSteps } from '../../../../utils';
import { FlowRuntimeContext } from '../../../../flowContext';
import { openStepSettingsDialog } from './StepSettingsDialog';
import { openStepSettingsDrawer } from './StepSettingsDrawer';

/**
 * 统一的步骤设置入口函数
 * 根据步骤的 uiMode 配置自动选择使用 Dialog 或 Drawer
 * @param props.model 模型实例
 * @param props.flowKey 流程Key
 * @param props.stepKey 步骤Key
 * @param props.width 对话框/抽屉宽度，默认为600
 * @param props.title 自定义标题，默认使用step的title
 * @returns Promise<any> 返回表单提交的值
 */
const openStepSettings = async ({ model, flowKey, stepKey, width = 600, title }: StepSettingsProps): Promise<any> => {
  const t = getT(model);

  // 获取流程和步骤信息
  const flow = model.getFlow(flowKey);
  const step = flow?.steps?.[stepKey];

  if (!flow) {
    message.error(t('Flow with key {{flowKey}} not found', { flowKey }));
    throw new Error(t('Flow with key {{flowKey}} not found', { flowKey }));
  }

  if (!step) {
    message.error(t('Step with key {{stepKey}} not found', { stepKey }));
    throw new Error(t('Step with key {{stepKey}} not found', { stepKey }));
  }

  // 创建设置专用的流程运行时上下文
  const ctx = new FlowRuntimeContext(model, flowKey, 'settings');
  setupRuntimeContextSteps(ctx, flow, model, flowKey);
  ctx.defineProperty('currentStep', { value: step });

  // 解析 uiMode，支持函数式
  const resolvedUiMode = await resolveUiMode(step.uiMode, ctx);

  // 提取模式和属性
  let settingMode: 'dialog' | 'drawer';
  let uiProps: Record<string, any> = {};

  if (typeof resolvedUiMode === 'string') {
    settingMode = resolvedUiMode;
  } else if (typeof resolvedUiMode === 'object' && resolvedUiMode.type) {
    settingMode = resolvedUiMode.type;
    uiProps = resolvedUiMode.props || {};
  } else {
    // 默认使用 dialog 模式
    settingMode = 'dialog';
  }

  // 根据 settingMode 选择相应的打开方式
  if (settingMode === 'drawer') {
    return openStepSettingsDrawer({
      model,
      flowKey,
      stepKey,
      drawerWidth: width,
      drawerTitle: title,
      ctx,
      ...uiProps,
    });
  } else {
    return openStepSettingsDialog({
      model,
      flowKey,
      stepKey,
      dialogWidth: width,
      dialogTitle: title,
      ctx,
      ...uiProps,
    });
  }
};

/**
 * 获取步骤的设置模式
 * @param stepKey 步骤Key
 * @param ctx 流程运行时上下文
 * @returns Promise<'dialog' | 'drawer' | null> 设置模式，如果步骤不存在则返回null
 */
const getStepSettingMode = async (stepKey: string, ctx: FlowRuntimeContext): Promise<'dialog' | 'drawer' | null> => {
  try {
    const model = ctx.model;
    const flowKey = ctx.flowKey;
    const flow = model.getFlow(flowKey);
    const step = flow?.steps?.[stepKey];

    if (!step) {
      return null;
    }

    // 确保上下文中设置了当前步骤
    if (!ctx.currentStep || ctx.currentStep !== step) {
      ctx.defineProperty('currentStep', { value: step });
    }

    // 解析 uiMode，支持函数式
    const resolvedUiMode = await resolveUiMode(step.uiMode, ctx);

    if (typeof resolvedUiMode === 'string') {
      return resolvedUiMode;
    } else if (typeof resolvedUiMode === 'object' && resolvedUiMode.type) {
      return resolvedUiMode.type;
    } else {
      // 默认使用 dialog 模式
      return 'dialog';
    }
  } catch (error) {
    console.warn('Error getting step setting mode:', error);
    return null;
  }
};

export { getStepSettingMode, openStepSettings, openStepSettingsDialog, openStepSettingsDrawer };
