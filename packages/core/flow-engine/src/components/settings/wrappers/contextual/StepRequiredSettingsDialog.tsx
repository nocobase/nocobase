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

const SchemaField = createSchemaField();

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
    return new Promise(async (resolve, reject) => {
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

                    // 如果有可配置的UI Schema，添加到列表中
                    if (Object.keys(mergedUiSchema).length > 0) {
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

        // 如果没有需要配置的步骤，显示提示
        if (requiredSteps.length === 0) {
            message.info('没有需要配置参数的步骤');
            resolve({});
            return;
        }

        // 获取所有步骤的初始值
        const initialValues: Record<string, any> = {};
        requiredSteps.forEach(({ flowKey, stepKey, step }) => {
            const stepParams = model.getStepParams(flowKey, stepKey) || {};
            const defaultParams = step.defaultParams || {};
            const mergedParams = { ...defaultParams, ...stepParams };

            if (Object.keys(mergedParams).length > 0) {
                if (!initialValues[flowKey]) {
                    initialValues[flowKey] = {};
                }
                initialValues[flowKey][stepKey] = mergedParams;
            }
        });

        // 构建分步表单的 Schema
        const stepPanes: Record<string, any> = {};

        requiredSteps.forEach(({ flowKey, stepKey, uiSchema, title, flowTitle }, index) => {
            const stepId = `${flowKey}_${stepKey}`;

            stepPanes[stepId] = {
                type: 'void',
                'x-component': 'FormStep.StepPane',
                'x-component-props': {
                    title: `${title}`,
                    description: `流: ${flowTitle}`,
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
        const formSchema: ISchema = {
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
        try {
            const { FormDialog, FormStep } = await import('@formily/antd-v5');
            // 创建分步表单实例
            const formStep = FormStep.createFormStep(0);

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
                            // await form.submit();
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
                            reject(error);
                            // 这里不需要reject，因为forConfirm会处理
                        }
                    };

                    const handleClose = () => {
                        formDialog.close();
                        resolve({});
                    };

                    return (
                        <>
                            <SchemaField
                                schema={formSchema}
                                components={{
                                    FormStep,
                                    ...flowEngine.flowSettings?.components,
                                }}
                                scope={{
                                    formStep,
                                    totalSteps: requiredSteps.length,
                                    closeDialog: handleClose,
                                    handleNext: () => {
                                        // 验证当前步骤的表单
                                        form.validate().then(() => {
                                            formStep.next();
                                        }).catch((errors) => {
                                            console.log('表单验证失败:', errors);
                                            // 可以在这里添加更详细的错误处理
                                        });
                                    },
                                    ...flowEngine.flowSettings?.scopes,
                                }}
                            />
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
                                        <Button
                                            disabled={!formStep.allowBack}
                                            onClick={() => {
                                                formStep.back();
                                            }}
                                        >
                                            上一步
                                        </Button>
                                        <Button
                                            disabled={!formStep.allowNext}
                                            type="primary"
                                            onClick={() => {
                                                // 验证当前步骤的表单
                                                form.validate().then(() => {
                                                    formStep.next();
                                                }).catch((errors) => {
                                                    console.log('表单验证失败:', errors);
                                                    // 可以在这里添加更详细的错误处理
                                                });
                                            }}
                                            style={{
                                                display: formStep.current < requiredSteps.length - 1 ? 'inline-block' : 'none',
                                            }}
                                        >
                                            下一步
                                        </Button>
                                        <Button
                                            disabled={formStep.allowNext}
                                            type="primary"
                                            onClick={handleSubmit}
                                            style={{
                                                display: formStep.current >= requiredSteps.length - 1 ? 'inline-block' : 'none',
                                            }}
                                        >
                                            完成配置
                                        </Button>
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
    });
};

export { openRequiredParamsStepFormDialog };