/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormButtonGroup } from '@formily/antd-v5';
import { createForm } from '@formily/core';
import { createSchemaField, FormProvider, ISchema } from '@formily/react';
import { toJS } from '@formily/reactive';
import { Button, message, Space } from 'antd';
import React from 'react';
import { StepSettingsDialogProps } from '../../../../types';
import { compileUiSchema, getT, resolveDefaultParams, resolveUiSchema } from '../../../../utils';
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
  mode = 'dialog',
}: StepSettingsDialogProps): Promise<any> => {
  const t = getT(model);
  const message = model.flowEngine.getContext('message');

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

  let title = step.title;

  // 创建参数解析上下文
  const paramsContext = {
    model,
    globals: model.flowEngine.getContext(),
    app: model.flowEngine.getContext('app'),
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
    title = title || action.title;
  }

  // 解析动态 uiSchema
  const resolvedActionUiSchema = await resolveUiSchema(actionUiSchema, paramsContext);
  const resolvedStepUiSchema = await resolveUiSchema(stepUiSchema, paramsContext);

  // 合并uiSchema，确保step的uiSchema优先级更高
  const mergedUiSchema = { ...toJS(resolvedActionUiSchema) };
  Object.entries(toJS(resolvedStepUiSchema)).forEach(([fieldKey, schema]) => {
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

  const flowEngine = model.flowEngine;
  const scopes = {
    useStepSettingContext,
    ...flowEngine.flowSettings?.scopes,
  };

  // 获取初始值
  const stepParams = model.getStepParams(flowKey, stepKey) || {};

  // 解析 defaultParams
  const resolvedDefaultParams = await resolveDefaultParams(step.defaultParams, paramsContext as any);
  const resolveActionDefaultParams = await resolveDefaultParams(actionDefaultParams, paramsContext as any);
  const initialValues = { ...toJS(resolveActionDefaultParams), ...toJS(resolvedDefaultParams), ...toJS(stepParams) };

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

  const view = model.flowEngine.getContext(mode);

  const form = createForm({
    initialValues: compileUiSchema(scopes, initialValues),
  });

  const currentDialog = view.open({
    title: dialogTitle || t(title),
    width: dialogWidth,
    destroyOnClose: true,
    footer: (
      <Space align="end">
        <Button
          type="default"
          onClick={() => {
            currentDialog.close();
          }}
        >
          {t('Cancel')}
        </Button>
        <Button
          type="primary"
          onClick={async () => {
            try {
              await form.submit();
              const currentValues = form.values;
              model.setStepParams(flowKey, stepKey, currentValues);
              currentDialog.close();
              model
                .save()
                .then(() => {
                  message.success(t('Configuration saved'));
                })
                .catch((_error) => {
                  message.error(t('Error saving configuration, please check console'));
                });
            } catch (error) {
              console.error(t('Error saving configuration'), ':', error);
              message.error(t('Error saving configuration, please check console'));
            }
          }}
        >
          {t('OK')}
        </Button>
      </Space>
    ),
    content: (currentDialog) => {
      const contextValue: StepSettingContextType = {
        model,
        globals: model.flowEngine.getContext(),
        app: model.flowEngine.getContext('app'),
        step,
        flow,
        flowKey,
        stepKey,
      };
      // 编译 formSchema 中的表达式
      const compiledFormSchema = compileUiSchema(scopes, formSchema);
      return (
        <FormProvider form={form}>
          <StepSettingContextProvider value={contextValue}>
            <SchemaField
              schema={compiledFormSchema}
              components={{
                ...flowEngine.flowSettings?.components,
              }}
              scope={scopes}
            />
          </StepSettingContextProvider>
        </FormProvider>
      );
    },
  });
};

export { openStepSettingsDialog };
