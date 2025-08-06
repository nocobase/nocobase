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
import { autorun, observable, model as observableModel, toJS } from '@formily/reactive';
import { Button, Space } from 'antd';
import React, { useEffect } from 'react';
import { FlowSettingsContextProvider, useFlowSettingsContext } from '../../../../hooks/useFlowSettingsContext';
import { StepSettingsDialogProps } from '../../../../types';
import { compileUiSchema, FlowExitException, getT, resolveDefaultParams, resolveStepUiSchema } from '../../../../utils';

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
  ctx,
  uiModeProps,
  cleanup,
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

  const flowRuntimeContext = ctx;

  // 确保上下文中设置了当前步骤
  if (!flowRuntimeContext.currentStep || flowRuntimeContext.currentStep !== step) {
    flowRuntimeContext.defineProperty('currentStep', { value: step });
  }

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

  const openView = model.context.viewer[mode].bind(model.context.viewer);

  const form = createForm({
    initialValues: compileUiSchema(scopes, initialValues),
  });

  const currentDialog = openView({
    title: dialogTitle || t(title),
    width: dialogWidth,
    destroyOnClose: true,
    ...toJS(uiModeProps),
    onClose: () => {
      if (cleanup) {
        cleanup();
      }
    },
    content: (currentDialog) => {
      const DialogContent = observable(() => {
        useEffect(() => {
          return autorun(() => {
            const dynamicProps = toJS(uiModeProps);
            currentDialog.update(dynamicProps);
          });
        }, []);

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
              <currentDialog.Footer>
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
              </currentDialog.Footer>
            </FlowSettingsContextProvider>
          </FormProvider>
        );
      });

      return <DialogContent />;
    },
  });
};

export { openStepSettingsDialog };
