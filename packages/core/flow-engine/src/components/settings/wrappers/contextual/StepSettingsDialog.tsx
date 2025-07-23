/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createForm } from '@formily/core';
import { createSchemaField, FormProvider, ISchema } from '@formily/react';
import { toJS } from '@formily/reactive';
import { Button, Space } from 'antd';
import React from 'react';
import { StepSettingsDialogProps } from '../../../../types';
import {
  compileUiSchema,
  getT,
  resolveDefaultParams,
  resolveStepUiSchema,
  setupRuntimeContextSteps,
  FlowExitException,
} from '../../../../utils';
import { FlowSettingsContextProvider, useFlowSettingsContext } from '../../../../hooks/useFlowSettingsContext';
import { FlowRuntimeContext } from '../../../../flowContext';

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
  const message = model.context.message;

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
  let beforeParamsSave = step.beforeParamsSave;
  let afterParamsSave = step.afterParamsSave;

  let actionDefaultParams = {};
  if (step.use) {
    const action = model.flowEngine?.getAction?.(step.use);
    if (action) {
      actionDefaultParams = action.defaultParams || {};
      title = title || action.title;
      beforeParamsSave = beforeParamsSave || action.beforeParamsSave;
      afterParamsSave = afterParamsSave || action.afterParamsSave;
    }
  }

  // 获取流程定义
  const flowDefinition = model.getFlow(flowKey);

  const mergedUiSchema = await resolveStepUiSchema(model, flowDefinition, step);

  // 如果没有可配置的UI Schema，显示提示
  if (!mergedUiSchema) {
    message.info(t('This step has no configurable parameters'));
    return {};
  }

  // 创建流程运行时上下文用于解析默认参数
  const flowRuntimeContext = new FlowRuntimeContext(model, flowKey, 'settings');
  setupRuntimeContextSteps(flowRuntimeContext, flow, model, flowKey);

  flowRuntimeContext.defineProperty('currentStep', { value: step });

  const flowEngine = model.flowEngine;
  const scopes = {
    useFlowSettingsContext,
    ...flowEngine.flowSettings?.scopes,
  };

  // 获取初始值
  const stepParams = model.getStepParams(flowKey, stepKey) || {};

  // 解析 defaultParams
  const resolvedDefaultParams = await resolveDefaultParams(step.defaultParams, flowRuntimeContext);
  const resolveActionDefaultParams = await resolveDefaultParams(actionDefaultParams, flowRuntimeContext);
  const initialValues = { ...toJS(resolveActionDefaultParams), ...toJS(resolvedDefaultParams), ...toJS(stepParams) };

  // 保存旧参数用于 onParamsChange 回调
  const previousParams = { ...toJS(stepParams) };

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

  const view = model.context[mode];

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

              // Call beforeParamsSave callback if it exists
              if (beforeParamsSave) {
                await beforeParamsSave(flowRuntimeContext, currentValues, previousParams);
              }

              currentDialog.close();
              await model.save();
              message.success(t('Configuration saved'));
              // Call afterParamsSave callback if it exists
              if (afterParamsSave) {
                await afterParamsSave(flowRuntimeContext, currentValues, previousParams);
              }
            } catch (error) {
              if (error instanceof FlowExitException) {
                currentDialog.close();
                return;
              }
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
      // 编译 formSchema 中的表达式
      const compiledFormSchema = compileUiSchema(scopes, formSchema);
      return (
        <FormProvider form={form}>
          <FlowSettingsContextProvider value={flowRuntimeContext}>
            <SchemaField
              schema={compiledFormSchema}
              components={{
                ...flowEngine.flowSettings?.components,
              }}
              scope={scopes}
            />
          </FlowSettingsContextProvider>
        </FormProvider>
      );
    },
  });
};

export { openStepSettingsDialog };
