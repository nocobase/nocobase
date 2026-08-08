/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createSchemaField, FormConsumer, ISchema } from '@formily/react';
import { toJS } from '@formily/reactive';
import { Button, message } from 'antd';
import React from 'react';
import { FlowRuntimeContext } from '../../../../flowContext';
import { FlowSettingsContextProvider, useFlowSettingsContext } from '../../../../hooks/useFlowSettingsContext';
import { FlowModel } from '../../../../models';
import { StepDefinition } from '../../../../types';
import {
  compileUiSchema,
  createFlowWithSettingSteps,
  getFlowSettingSteps,
  getT,
  resolveDefaultParams,
  resolveStepUiSchema,
  setupRuntimeContextSteps,
} from '../../../../utils';

const SchemaField = createSchemaField();

/**
 * 多步骤上下文提供器 - 为每个步骤提供相应的上下文信息
 * 能够根据当前步骤动态切换上下文
 */
interface MultiStepContextProviderProps {
  model: FlowModel;
  requiredSteps: Array<{
    flowKey: string;
    stepKey: string;
    step: StepDefinition;
    uiSchema: Record<string, ISchema>;
    title: string;
    flowTitle: string;
    flowSteps: Record<string, StepDefinition>;
  }>;
  formStep: { current?: number } | null;
  children: React.ReactNode;
}

const MultiStepContextProvider: React.FC<MultiStepContextProviderProps> = ({
  model,
  requiredSteps,
  formStep,
  children,
}) => {
  // 获取当前步骤索引
  const currentStepIndex = formStep?.current ?? 0;
  const currentStepInfo = requiredSteps[currentStepIndex];

  // 根据当前步骤创建上下文
  const flowRuntimeContext = React.useMemo(() => {
    const { flowKey, step } = currentStepInfo;
    const ctx = new FlowRuntimeContext(model, flowKey, 'settings');
    setupRuntimeContextSteps(ctx, currentStepInfo.flowSteps, model, flowKey);
    ctx.defineProperty('currentStep', { value: step });
    return ctx;
  }, [model, currentStepInfo]);

  return <FlowSettingsContextProvider value={flowRuntimeContext}>{children}</FlowSettingsContextProvider>;
};

/**
 * 分步表单对话框的属性接口
 */
export interface StepFormDialogProps {
  model: FlowModel;
  dialogWidth?: number | string;
  dialogTitle?: string;
}

/**
 * StepFormDialog组件 - 使用 FormDialog 和 FormStep 显示所有需要配置参数的步骤
 * @param props.model 模型实例
 * @param props.dialogWidth 对话框宽度，默认为800
 * @param props.dialogTitle 自定义对话框标题，默认为"步骤参数配置"
 * @returns Promise<any> 返回表单提交的值
 */
const openRequiredParamsStepFormDialog = async ({
  model,
  dialogWidth = 800,
  dialogTitle,
}: StepFormDialogProps): Promise<any> => {
  const t = getT(model);
  const defaultTitle = dialogTitle || t('Step parameter configuration');

  if (!model) {
    message.error(t('Invalid model provided'));
    throw new Error(t('Invalid model provided'));
  }

  // 创建一个Promise, 并最终返回，当此弹窗关闭时此promise resolve或者reject
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        // 获取所有流程
        const allFlows = (model as FlowModel).getFlows();

        // 收集所有需要配置参数的步骤
        const requiredSteps: Array<{
          flowKey: string;
          stepKey: string;
          step: StepDefinition;
          uiSchema: Record<string, ISchema>;
          title: string;
          flowTitle: string;
          flowSteps: Record<string, StepDefinition>;
        }> = [];

        for (const [flowKey, flow] of allFlows) {
          const flowSteps = await getFlowSettingSteps(model, flow, flowKey);
          const flowForSettings = createFlowWithSettingSteps(flow, flowSteps, flowKey);
          for (const stepKey in flowSteps) {
            const step = flowSteps[stepKey];

            // 只处理 paramsRequired 为 true 的步骤
            if (step.paramsRequired || step.preset) {
              // 使用提取的工具函数解析并合并uiSchema
              const mergedUiSchema = await resolveStepUiSchema(model, flowForSettings, step);

              // 如果有可配置的UI Schema，检查是否已经有了所需的配置值
              if (mergedUiSchema) {
                // 获取当前步骤的参数
                requiredSteps.push({
                  flowKey,
                  stepKey,
                  step,
                  uiSchema: mergedUiSchema,
                  title: step.title || stepKey,
                  flowTitle: flow.title || flowKey,
                  flowSteps,
                });
              }
            }
          }
        }

        // 如果没有需要配置的步骤，显示提示
        if (requiredSteps.length === 0) {
          resolve({});
          return;
        }

        // 获取所有步骤的初始值
        const initialValues: Record<string, any> = {};

        for (const { flowKey, stepKey, step, flowSteps } of requiredSteps) {
          const stepParams = model.getStepParams(flowKey, stepKey) || {};
          // 如果step使用了action，也获取action的defaultParams
          let actionDefaultParams = {};
          if (step.use) {
            const action = model.flowEngine?.getAction?.(step.use);
            actionDefaultParams = action.defaultParams || {};
          }
          // Create flowRuntimeContext for this step
          const flowRuntimeContext = new FlowRuntimeContext(model, flowKey, 'settings');
          setupRuntimeContextSteps(flowRuntimeContext, flowSteps, model, flowKey);
          flowRuntimeContext.defineProperty('currentStep', { value: step });

          // 解析 defaultParams
          const resolvedActionDefaultParams = await resolveDefaultParams(actionDefaultParams, flowRuntimeContext);
          const resolvedDefaultParams = await resolveDefaultParams(step.defaultParams, flowRuntimeContext);
          const mergedParams = {
            ...toJS(resolvedActionDefaultParams),
            ...toJS(resolvedDefaultParams),
            ...toJS(stepParams),
          };

          if (Object.keys(mergedParams).length > 0) {
            if (!initialValues[flowKey]) {
              initialValues[flowKey] = {};
            }
            initialValues[flowKey][stepKey] = mergedParams;
          }
        }

        // 构建分步表单的 Schema
        const stepPanes: Record<string, any> = {};

        requiredSteps.forEach(({ flowKey, stepKey, uiSchema, title, flowTitle }) => {
          const stepId = `${flowKey}_${stepKey}`;

          stepPanes[stepId] = {
            type: 'void',
            'x-component': 'FormStep.StepPane',
            'x-component-props': {
              title: `${title}`,
              description: `Flow: ${flowTitle}`,
            },
            properties: {
              layout: {
                type: 'void',
                'x-component': 'FormLayout',
                'x-component-props': {
                  layout: 'vertical',
                },
                properties: {
                  [flowKey]: {
                    type: 'object',
                    properties: {
                      [stepKey]: {
                        type: 'object',
                        properties: uiSchema,
                      },
                    },
                  },
                },
              },
            },
          };
        });

        // 构建完整的表单Schema
        // 当只有一个步骤时，不使用FormStep组件，直接渲染表单内容
        const formSchema: ISchema =
          requiredSteps.length === 1
            ? {
                type: 'object',
                properties: {
                  // 直接渲染单个步骤的内容，不显示步骤指示器
                  ...Object.values(stepPanes)[0].properties,
                },
              }
            : {
                type: 'object',
                properties: {
                  step: {
                    type: 'void',
                    'x-component': 'FormStep',
                    'x-component-props': {
                      formStep: '{{formStep}}',
                    },
                    properties: stepPanes,
                  },
                },
              };

        // 动态导入所需组件
        const { FormDialog, FormStep } = await import('@formily/antd-v5');
        // 创建分步表单实例（只有多个步骤时才需要）
        const formStep = requiredSteps.length > 1 ? FormStep.createFormStep(0) : null;

        const flowEngine = model.flowEngine;
        const scopes = {
          formStep,
          totalSteps: requiredSteps.length,
          requiredSteps,
          useFlowSettingsContext,
          ...flowEngine.flowSettings?.scopes,
        };

        // 创建FormDialog
        const formDialog = FormDialog(
          {
            title: dialogTitle || t('Step parameter configuration'),
            width: dialogWidth,
            footer: null, // 移除默认的底部按钮，使用自定义的导航按钮
            destroyOnClose: true,
          },
          (form) => {
            const handleSubmit = async () => {
              try {
                await form.submit();
                const currentValues = form.values;

                // 保存每个步骤的参数
                const savedSteps: Array<{
                  step: StepDefinition;
                  ctx: FlowRuntimeContext;
                  params: Record<string, unknown>;
                  previousParams: Record<string, unknown>;
                }> = [];
                for (const { flowKey, stepKey, step, flowSteps } of requiredSteps) {
                  const stepValues = currentValues[flowKey]?.[stepKey];
                  if (stepValues) {
                    const previousParams = model.getStepParams(flowKey, stepKey) || {};
                    const ctx = new FlowRuntimeContext(model, flowKey, 'settings');
                    setupRuntimeContextSteps(ctx, flowSteps, model, flowKey);
                    ctx.defineProperty('currentStep', { value: step });
                    const action = step.use ? model.getAction?.(step.use) : undefined;
                    const beforeParamsSave = step.beforeParamsSave || action?.beforeParamsSave;

                    if (step.persistParams !== false) {
                      model.setStepParams(flowKey, stepKey, stepValues);
                    }
                    if (beforeParamsSave) {
                      await beforeParamsSave(ctx, stepValues, previousParams);
                    }
                    savedSteps.push({ step, ctx, params: stepValues, previousParams });
                  }
                }

                await model.saveStepParams();
                for (const { step, ctx, params, previousParams } of savedSteps) {
                  const action = step.use ? model.getAction?.(step.use) : undefined;
                  const afterParamsSave = step.afterParamsSave || action?.afterParamsSave;
                  if (afterParamsSave) {
                    await afterParamsSave(ctx, params, previousParams);
                  }
                }
                // message.success('所有步骤参数配置已保存');
                resolve(currentValues);
                formDialog.close();
              } catch (error) {
                console.error(t('Error submitting form'), ':', error);
                // reject(error);
                // 这里不需要reject，因为forConfirm会处理
              }
            };

            const handleClose = () => {
              formDialog.close();
              resolve({});
            };

            const dialogScopes = {
              ...scopes,
              closeDialog: handleClose,
              handleNext: () => {
                // 验证当前步骤的表单
                form
                  .validate()
                  .then(() => {
                    if (formStep) {
                      formStep.next();
                    }
                  })
                  .catch((errors: any) => {
                    console.log(t('Form validation failed'), ':', errors);
                    // 可以在这里添加更详细的错误处理
                  });
              },
            };

            // 编译 formSchema 中的表达式
            const compiledFormSchema = compileUiSchema(dialogScopes, formSchema);

            return (
              <>
                <MultiStepContextProvider model={model} requiredSteps={requiredSteps} formStep={formStep}>
                  <SchemaField
                    schema={compiledFormSchema}
                    components={{
                      FormStep,
                      ...flowEngine.flowSettings?.components,
                    }}
                    scope={dialogScopes}
                  />
                </MultiStepContextProvider>
                <FormConsumer>
                  {() => (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 8,
                        marginTop: 24,
                        paddingTop: 16,
                        borderTop: '1px solid #f0f0f0',
                      }}
                    >
                      {/* 只有一个步骤时，只显示完成按钮 */}
                      {requiredSteps.length === 1 ? (
                        <Button type="primary" onClick={handleSubmit}>
                          {t('Complete configuration')}
                        </Button>
                      ) : (
                        <>
                          <Button
                            disabled={!formStep?.allowBack}
                            onClick={() => {
                              if (formStep) {
                                formStep.back();
                              }
                            }}
                          >
                            {t('Previous step')}
                          </Button>
                          <Button
                            disabled={!formStep?.allowNext}
                            type="primary"
                            onClick={() => {
                              // 验证当前步骤的表单
                              form
                                .validate()
                                .then(() => {
                                  if (formStep) {
                                    formStep.next();
                                  }
                                })
                                .catch((errors: any) => {
                                  console.log(t('Form validation failed'), ':', errors);
                                  // 可以在这里添加更详细的错误处理
                                });
                            }}
                            style={{
                              display: (formStep?.current ?? 0) < requiredSteps.length - 1 ? 'inline-block' : 'none',
                            }}
                          >
                            {t('Next step')}
                          </Button>
                          <Button
                            disabled={formStep?.allowNext}
                            type="primary"
                            onClick={handleSubmit}
                            style={{
                              display: (formStep?.current ?? 0) >= requiredSteps.length - 1 ? 'inline-block' : 'none',
                            }}
                          >
                            {t('Complete configuration')}
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </FormConsumer>
              </>
            );
          },
        );

        // 打开对话框
        formDialog.open({
          initialValues: compileUiSchema(scopes, initialValues),
        });
      } catch (error) {
        reject(new Error(`${t('Failed to import FormDialog or FormStep')}: ${error.message}`));
      }
    })();
  }).catch((e) => {
    console.error(e);
  });
};

export { openRequiredParamsStepFormDialog };
