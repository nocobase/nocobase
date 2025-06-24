/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { message } from 'antd';
import { ActionStepDefinition, InlineStepDefinition, StepSettingsProps } from '../../../../types';
import { openStepSettingsDialog } from './StepSettingsDialog';
import { openStepSettingsDrawer } from './StepSettingsDrawer';

/**
 * 统一的步骤设置入口函数
 * 根据步骤的 settingMode 配置自动选择使用 Dialog 或 Drawer
 * @param props.model 模型实例
 * @param props.flowKey 流程Key
 * @param props.stepKey 步骤Key
 * @param props.width 对话框/抽屉宽度，默认为600
 * @param props.title 自定义标题，默认使用step的title
 * @returns Promise<any> 返回表单提交的值
 */
const openStepSettings = async ({ model, flowKey, stepKey, width = 600, title }: StepSettingsProps): Promise<any> => {
  if (!model) {
    message.error('提供的模型无效');
    throw new Error('提供的模型无效');
  }

  // 获取流程和步骤信息
  const flow = model.getFlow(flowKey);
  const step = flow?.steps?.[stepKey];

  if (!flow) {
    message.error(`未找到Key为 ${flowKey} 的流程`);
    throw new Error(`未找到Key为 ${flowKey} 的流程`);
  }

  if (!step) {
    message.error(`未找到Key为 ${stepKey} 的步骤`);
    throw new Error(`未找到Key为 ${stepKey} 的步骤`);
  }

  // 获取步骤定义
  const stepDefinition = step as ActionStepDefinition | InlineStepDefinition;

  // 检查步骤的 settingMode 配置，默认为 'dialog'
  const settingMode = stepDefinition.settingMode || 'dialog';

  // 根据 settingMode 选择相应的打开方式
  if (settingMode === 'drawer') {
    return openStepSettingsDrawer({
      model,
      flowKey,
      stepKey,
      drawerWidth: width,
      drawerTitle: title,
    });
  } else {
    return openStepSettingsDialog({
      model,
      flowKey,
      stepKey,
      dialogWidth: width,
      dialogTitle: title,
    });
  }
};

/**
 * 检查步骤是否配置为使用抽屉模式
 * @param model 模型实例
 * @param flowKey 流程Key
 * @param stepKey 步骤Key
 * @returns boolean 是否使用抽屉模式
 */
const isStepUsingDrawerMode = (model: any, flowKey: string, stepKey: string): boolean => {
  try {
    const flow = model.getFlow(flowKey);
    const step = flow?.steps?.[stepKey];

    if (!step) {
      return false;
    }

    const stepDefinition = step as ActionStepDefinition | InlineStepDefinition;
    return stepDefinition.settingMode === 'drawer';
  } catch (error) {
    console.warn('检查步骤设置模式时出错:', error);
    return false;
  }
};

/**
 * 获取步骤的设置模式
 * @param model 模型实例
 * @param flowKey 流程Key
 * @param stepKey 步骤Key
 * @returns 'dialog' | 'drawer' | null 设置模式，如果步骤不存在则返回null
 */
const getStepSettingMode = (model: any, flowKey: string, stepKey: string): 'dialog' | 'drawer' | null => {
  try {
    const flow = model.getFlow(flowKey);
    const step = flow?.steps?.[stepKey];

    if (!step) {
      return null;
    }

    const stepDefinition = step as ActionStepDefinition | InlineStepDefinition;
    return stepDefinition.settingMode || 'dialog';
  } catch (error) {
    console.warn('获取步骤设置模式时出错:', error);
    return null;
  }
};

export { openStepSettings, isStepUsingDrawerMode, getStepSettingMode, openStepSettingsDialog, openStepSettingsDrawer };
