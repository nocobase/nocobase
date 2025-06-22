/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createSchemaField, ISchema } from '@formily/react';
import { message } from 'antd';
import React from 'react';
import { ActionStepDefinition, StepSettingsDialogProps } from '../../../../types';
import { resolveDefaultParams } from '../../../../utils';
import { StepSettingContextProvider, StepSettingContextType, useStepSettingContext } from './StepSettingContext';

const SchemaField = createSchemaField();

/**
 * StepSettingsDialog组件 - 使用 FormDialog 显示单个步骤的配置界面
 * @param props.model 模型实例
 * @param props.flowKey 流程Key
 * @param props.stepKey 步骤Key
 * @param props.dialogWidth 对话框宽度，默认为600
 * @param props.dialogTitle 自定义对话框标题，默认使用step的title
 * @returns Promise<any> 返回表单提交的值
 */
const openStepSettingsDialog = async ({
  model,
  flowKey,
  stepKey,
  dialogWidth = 600,
  dialogTitle,
}: StepSettingsDialogProps): Promise<any> => {
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

  const title = dialogTitle || (step ? `${step.title || stepKey} - 配置` : `步骤配置 - ${stepKey}`);

  // 获取可配置的步骤信息
  const stepDefinition = step as ActionStepDefinition;
  const stepUiSchema = stepDefinition.uiSchema || {};
  let actionDefaultParams = {};

  // 如果step使用了action，也获取action的uiSchema
  let actionUiSchema = {};
  if (stepDefinition.use) {
    const action = model.flowEngine?.getAction?.(stepDefinition.use);
    if (action && action.uiSchema) {
      actionUiSchema = action.uiSchema;
    }
    actionDefaultParams = action.defaultParams || {};
  }

  // 合并uiSchema，确保step的uiSchema优先级更高
  const mergedUiSchema = { ...actionUiSchema };
  Object.entries(stepUiSchema).forEach(([fieldKey, schema]) => {
    if (mergedUiSchema[fieldKey]) {
      mergedUiSchema[fieldKey] = { ...mergedUiSchema[fieldKey], ...schema };
    } else {
      mergedUiSchema[fieldKey] = schema;
    }
  });

  // 如果没有可配置的UI Schema，显示提示
  if (Object.keys(mergedUiSchema).length === 0) {
    message.info('此步骤没有可配置的参数');
    return {};
  }

  // 获取初始值
  const stepParams = model.getStepParams(flowKey, stepKey) || {};

  // 创建参数解析上下文
  const paramsContext = {
    model,
    globals: model.flowEngine?.context || {},
    app: model.flowEngine,
  };

  // 解析 defaultParams
  const resolvedDefaultParams = await resolveDefaultParams(stepDefinition.defaultParams, paramsContext);
  const resolveActionDefaultParams = await resolveDefaultParams(actionDefaultParams, paramsContext);
  const initialValues = { ...resolveActionDefaultParams, ...resolvedDefaultParams, ...stepParams };

  // 构建表单Schema
  const formSchema: ISchema = {
    type: 'object',
    properties: {
      layout: {
        type: 'void',
        'x-component': 'FormLayout',
        'x-component-props': {
          layout: 'vertical', // 垂直布局
        },
        properties: mergedUiSchema,
      },
    },
  };

  // 动态导入FormDialog
  let FormDialog;
  try {
    ({ FormDialog } = await import('@formily/antd-v5'));
  } catch (error) {
    throw new Error(`导入 FormDialog 失败: ${error.message}`);
  }

  // 创建FormDialog
  const formDialog = FormDialog(
    {
      title,
      width: dialogWidth,
      okText: '确认',
      cancelText: '取消',
      destroyOnClose: true,
    },
    (form) => {
      const flowEngine = model.flowEngine || {};

      // 创建上下文值
      const contextValue: StepSettingContextType = {
        model,
        globals: model.flowEngine?.context || {},
        app: model.flowEngine,
        step,
        flow,
        flowKey,
        stepKey,
      };

      return (
        <StepSettingContextProvider value={contextValue}>
          <SchemaField
            schema={formSchema}
            components={{
              ...flowEngine.flowSettings?.components,
            }}
            scope={{
              useStepSettingContext,
              ...flowEngine.flowSettings?.scopes,
            }}
          />
        </StepSettingContextProvider>
      );
    },
  );

  // 设置保存回调
  formDialog.forConfirm(async (payload, next) => {
    try {
      // 获取表单当前值
      const currentValues = payload.values;
      model.setStepParams(flowKey, stepKey, currentValues);
      await model.save();
      message.success('配置已保存');
      next(payload);
    } catch (error) {
      console.error('保存配置时出错:', error);
      message.error('保存配置时出错，请检查控制台');
      throw error;
    }
  });

  formDialog.forCancel(async (payload, next) => next(payload));

  // 打开对话框
  return formDialog.open({
    initialValues,
  });
};

export { openStepSettingsDialog, useStepSettingContext };
