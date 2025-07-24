/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { message } from 'antd';
import { FlowModel } from '../../../../models';
import { StepSettingsProps } from '../../../../types';
import { getT } from '../../../../utils';
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
  const t = getT(model);

  if (!model) {
    message.error(t('Invalid model provided'));
    throw new Error(t('Invalid model provided'));
  }

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

  // 检查步骤的 settingMode 配置，默认为 'dialog'
  const settingMode = step.uiMode || step.settingMode || 'dialog';

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
const isStepUsingDrawerMode = (model: FlowModel, flowKey: string, stepKey: string): boolean => {
  try {
    const flow = model.getFlow(flowKey);
    const step = flow?.steps?.[stepKey];

    if (!step) {
      return false;
    }

    return step.settingMode === 'drawer';
  } catch (error) {
    console.warn('Error checking step setting mode:', error);
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
const getStepSettingMode = (model: FlowModel, flowKey: string, stepKey: string): 'dialog' | 'drawer' | null => {
  try {
    const flow = model.getFlow(flowKey);
    const step = flow?.steps?.[stepKey];

    if (!step) {
      return null;
    }

    return (step.uiMode as any) || step.settingMode || 'dialog';
  } catch (error) {
    console.warn('Error getting step setting mode:', error);
    return null;
  }
};

export { getStepSettingMode, isStepUsingDrawerMode, openStepSettings, openStepSettingsDialog, openStepSettingsDrawer };
