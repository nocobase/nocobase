/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createSchemaField, ISchema, FormConsumer } from '@formily/react';
import { message, Button } from 'antd';
import React from 'react';
import { ActionStepDefinition } from '../../../../types';
import { resolveDefaultParams } from '../../../../utils';
import { StepSettingContextProvider, StepSettingContextType, useStepSettingContext } from './StepSettingContext';

/**
 * 检查步骤是否已经有了所需的配置值
 * @param uiSchema 步骤的 UI Schema
 * @param currentParams 当前步骤的参数
 * @returns 是否已经有了所需的配置值
 */
function hasRequiredParams(uiSchema: Record<string, any>, currentParams: Record<string, any>): boolean {
  // 检查 uiSchema 中所有 required 为 true 的字段
  for (const [fieldKey, fieldSchema] of Object.entries(uiSchema)) {
    if (fieldSchema.required === true) {
      // 如果字段是必需的，但当前参数中没有值或值为空
      const value = currentParams[fieldKey];
      if (value === undefined || value === null || value === '') {
        return false;
      }
    }
  }
  return true;
}

const SchemaField = createSchemaField();

/**
 * 多步骤上下文提供器 - 为每个步骤提供相应的上下文信息
 * 能够根据当前步骤动态切换上下文
 */
interface MultiStepContextProviderProps {
  model: any;
  requiredSteps: Array<{
    flowKey: string;
    stepKey: string;
    step: ActionStepDefinition;
    uiSchema: Record<string, any>;
    title: string;
    flowTitle: string;
  }>;
  formStep: any; // FormStep实例，用于获取当前步骤
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
  const contextValue: StepSettingContextType = React.useMemo(() => {
    if (!currentStepInfo) {
      // 如果没有当前步骤信息，返回基础上下文
      return {
        model,
        globals: model.flowEngine?.context || {},
        app: model.flowEngine,
        step: null,
        flow: null,
        flowKey: '',
        stepKey: '',
      };
    }

    const { flowKey, stepKey, step } = currentStepInfo;
    const flow = model.getFlow(flowKey);

    return {
      model,
      globals: model.flowEngine?.context || {},
      app: model.flowEngine,
      step,
      flow,
      flowKey,
      stepKey,
    };
  }, [model, currentStepInfo, currentStepIndex]);

  return <StepSettingContextProvider value={contextValue}>{children}</StepSettingContextProvider>;
};

/**
 * 分步表单对话框的属性接口
 */
export interface StepFormDialogProps {
  model: any;
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
  dialogTitle = '步骤参数配置',
}: StepFormDialogProps): Promise<any> => {
  if (!model) {
    message.error('提供的模型无效');
    throw new Error('提供的模型无效');
  }

  // 创建一个Promise, 并最终返回，当此弹窗关闭时此promise resolve或者reject
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        // 获取所有流程
        const constructor = model.constructor as typeof model.constructor;
        const allFlows = constructor.getFlows();

        // 收集所有需要配置参数的步骤
        const requiredSteps: Array<{
          flowKey: string;
          stepKey: string;
          step: ActionStepDefinition;
          uiSchema: Record<string, any>;
          title: string;
          flowTitle: string;
        }> = [];

        for (const [flowKey, flow] of allFlows) {
          for (const stepKey in flow.steps) {
            const step = flow.steps[stepKey] as ActionStepDefinition;

            // 只处理 paramsRequired 为 true 的步骤
            if (step.paramsRequired) {
              // 获取步骤的 uiSchema
              const stepUiSchema = step.uiSchema || {};

              // 如果step使用了action，也获取action的uiSchema
              let actionUiSchema = {};
              if (step.use) {
                const action = model.flowEngine?.getAction?.(step.use);
                if (action && action.uiSchema) {
                  actionUiSchema = action.uiSchema;
                }
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

              // 如果有可配置的UI Schema，检查是否已经有了所需的配置值
              if (Object.keys(mergedUiSchema).length > 0) {
                // 获取当前步骤的参数
                const currentStepParams = model.getStepParams(flowKey, stepKey) || {};

                // 检查是否已经有了所需的配置值
                const hasAllRequiredParams = hasRequiredParams(mergedUiSchema, currentStepParams);

                // 只有当缺少必需参数时才添加到列表中
                if (!hasAllRequiredParams) {
                  requiredSteps.push({
                    flowKey,
                    stepKey,
                    step,
                    uiSchema: mergedUiSchema,
                    title: step.title || stepKey,
                    flowTitle: flow.title || flowKey,
                  });
                }
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

        // 创建参数解析上下文用于解析函数形式的 defaultParams
        // 在 settings 中，我们只有基本的上下文信息
        const paramsContext = {
          model,
          globals: model.flowEngine?.context || {},
          app: model.flowEngine,
        };

        for (const { flowKey, stepKey, step } of requiredSteps) {
          const stepParams = model.getStepParams(flowKey, stepKey) || {};
          // 如果step使用了action，也获取action的defaultParams
          let actionDefaultParams = {};
          if (step.use) {
            const action = model.flowEngine?.getAction?.(step.use);
            actionDefaultParams = action.defaultParams || {};
          }
          // 解析 defaultParams
          const resolvedActionDefaultParams = await resolveDefaultParams(actionDefaultParams, paramsContext);
          const resolvedDefaultParams = await resolveDefaultParams(step.defaultParams, paramsContext);
          const mergedParams = { ...resolvedActionDefaultParams, ...resolvedDefaultParams, ...stepParams };

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

        // 创建FormDialog
        const formDialog = FormDialog(
          {
            title: dialogTitle,
            width: dialogWidth,
            footer: null, // 移除默认的底部按钮，使用自定义的导航按钮
            destroyOnClose: true,
          },
          (form) => {
            const flowEngine = model.flowEngine || {};

            const handleSubmit = async () => {
              try {
                await form.submit();
                const currentValues = form.values;

                // 保存每个步骤的参数
                requiredSteps.forEach(({ flowKey, stepKey }) => {
                  const stepValues = currentValues[flowKey]?.[stepKey];
                  if (stepValues) {
                    model.setStepParams(flowKey, stepKey, stepValues);
                  }
                });

                await model.save();
                // message.success('所有步骤参数配置已保存');
                resolve(currentValues);
                formDialog.close();
              } catch (error) {
                console.error('提交表单时出错:', error);
                // reject(error);
                // 这里不需要reject，因为forConfirm会处理
              }
            };

            const handleClose = () => {
              formDialog.close();
              resolve({});
            };

            return (
              <>
                <MultiStepContextProvider model={model} requiredSteps={requiredSteps} formStep={formStep}>
                  <SchemaField
                    schema={formSchema}
                    components={{
                      FormStep,
                      ...flowEngine.flowSettings?.components,
                    }}
                    scope={{
                      formStep,
                      totalSteps: requiredSteps.length,
                      requiredSteps,
                      useStepSettingContext,
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
                            console.log('表单验证失败:', errors);
                            // 可以在这里添加更详细的错误处理
                          });
                      },
                      ...flowEngine.flowSettings?.scopes,
                    }}
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
                          完成配置
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
                            上一步
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
                                  console.log('表单验证失败:', errors);
                                  // 可以在这里添加更详细的错误处理
                                });
                            }}
                            style={{
                              display: (formStep?.current ?? 0) < requiredSteps.length - 1 ? 'inline-block' : 'none',
                            }}
                          >
                            下一步
                          </Button>
                          <Button
                            disabled={formStep?.allowNext}
                            type="primary"
                            onClick={handleSubmit}
                            style={{
                              display: (formStep?.current ?? 0) >= requiredSteps.length - 1 ? 'inline-block' : 'none',
                            }}
                          >
                            完成配置
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
          initialValues,
        });
      } catch (error) {
        reject(new Error(`导入 FormDialog 或 FormStep 失败: ${error.message}`));
      }
    })();
  }).catch((e) => {
    console.error(e);
  });
};

export { openRequiredParamsStepFormDialog, useStepSettingContext };
