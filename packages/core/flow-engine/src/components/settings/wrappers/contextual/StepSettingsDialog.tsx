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
import { StepSettingsDialogProps } from '../../../../types';
import { resolveDefaultParams, resolveUiSchema, compileUiSchema, getT } from '../../../../utils';
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

  const title =
    dialogTitle ||
    (step ? `${step.title || stepKey} - ${t('Configuration')}` : `${t('Step Configuration')} - ${stepKey}`);

  // 创建参数解析上下文
  const paramsContext = {
    model,
    globals: model.flowEngine?.context || {},
    app: model.flowEngine?.context?.app,
  };

  // 获取可配置的步骤信息
  const stepUiSchema = step.uiSchema || {};
  let actionDefaultParams = {};

  // 如果step使用了action，也获取action的uiSchema
  let actionUiSchema = {};
  if (step.use) {
    const action = model.flowEngine?.getAction?.(step.use);
    if (action && action.uiSchema) {
      actionUiSchema = action.uiSchema;
    }
    actionDefaultParams = action.defaultParams || {};
  }

  // 解析动态 uiSchema
  const resolvedActionUiSchema = await resolveUiSchema(actionUiSchema, paramsContext);
  const resolvedStepUiSchema = await resolveUiSchema(stepUiSchema, paramsContext);

  // 合并uiSchema，确保step的uiSchema优先级更高
  const mergedUiSchema = { ...resolvedActionUiSchema };
  Object.entries(resolvedStepUiSchema).forEach(([fieldKey, schema]) => {
    if (mergedUiSchema[fieldKey]) {
      mergedUiSchema[fieldKey] = { ...mergedUiSchema[fieldKey], ...schema };
    } else {
      mergedUiSchema[fieldKey] = schema;
    }
  });

  // 如果没有可配置的UI Schema，显示提示
  if (Object.keys(mergedUiSchema).length === 0) {
    message.info(t('This step has no configurable parameters'));
    return {};
  }

  // 获取初始值
  const stepParams = model.getStepParams(flowKey, stepKey) || {};

  // 解析 defaultParams
  const resolvedDefaultParams = await resolveDefaultParams(step.defaultParams, paramsContext);
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
    throw new Error(`${t('Failed to import FormDialog')}: ${error.message}`);
  }

  // 创建FormDialog
  const formDialog = FormDialog(
    {
      title,
      width: dialogWidth,
      okText: t('OK'),
      cancelText: t('Cancel'),
      destroyOnClose: true,
    },
    (form) => {
      const flowEngine = model.flowEngine;

      // 创建上下文值
      const contextValue: StepSettingContextType = {
        model,
        globals: model.flowEngine?.context || {},
        app: model.flowEngine?.context?.app,
        step,
        flow,
        flowKey,
        stepKey,
      };

      const scopes = {
        useStepSettingContext,
        ...flowEngine.flowSettings?.scopes,
      };

      // 编译 formSchema 中的表达式
      const compiledFormSchema = compileUiSchema(scopes, formSchema);

      return (
        <StepSettingContextProvider value={contextValue}>
          <SchemaField
            schema={compiledFormSchema}
            components={{
              ...flowEngine.flowSettings?.components,
            }}
            scope={scopes}
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
      message.success(t('Configuration saved'));
      next(payload);
    } catch (error) {
      console.error(t('Error saving configuration'), ':', error);
      message.error(t('Error saving configuration, please check console'));
      throw error;
    }
  });

  formDialog.forCancel(async (payload, next) => next(payload));

  // 打开对话框
  return formDialog.open({
    initialValues,
  });
};

export { openStepSettingsDialog };
