/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Form, Alert, Button, Space, Input, Select, InputNumber, Switch } from 'antd';
import { FlowModel } from '../../../../models';
import { ActionStepDefinition } from '../../../../types';
import { useFlowModel } from '../../../../hooks';
import { observer } from '@formily/react';

// 创建两个组件版本，一个使用props传递的model，一个使用hook获取model
interface ModelProvidedProps {
  model: any;
  flowKey: string;
  onSave?: (values: any) => void; // 保存回调
  onCancel?: () => void; // 取消回调
  onError?: (error: any) => void; // 错误回调
  shouldSave?: boolean; // 是否应该保存，用于外部触发保存
  showActions?: boolean; // 是否显示操作按钮，默认为false
}

interface ModelByIdProps {
  uid: string;
  modelClassName: string;
  flowKey: string;
  onSave?: (values: any) => void; // 保存回调
  onCancel?: () => void; // 取消回调
  onError?: (error: any) => void; // 错误回调
  shouldSave?: boolean; // 是否应该保存，用于外部触发保存
  showActions?: boolean; // 是否显示操作按钮，默认为false
}

type FlowSettingsProps = ModelProvidedProps | ModelByIdProps;

// 判断是否是通过ID获取模型的props
const isModelByIdProps = (props: FlowSettingsProps): props is ModelByIdProps => {
  return 'uid' in props && 'modelClassName' in props && Boolean(props.uid) && Boolean(props.modelClassName);
};

// 提取核心渲染逻辑到一个共享组件
interface FlowSettingsContentProps {
  model: FlowModel;
  flowKey: string;
  onSave?: (values: any) => void;
  onCancel?: () => void;
  onError?: (error: any) => void;
  shouldSave?: boolean;
  showActions: boolean;
}

const FlowSettingsContent: React.FC<FlowSettingsContentProps> = observer(
  ({ model, flowKey, onSave, onCancel, onError, shouldSave, showActions }) => {
    const [form] = Form.useForm();
    const [lastShouldSave, setLastShouldSave] = useState(false);
    const [tempValues, setTempValues] = useState<any>({});

    // 获取流程定义
    const ModelClass = model.constructor as typeof FlowModel;
    const flows = ModelClass.getFlows();
    const flow = flows.get(flowKey);

    // 获取可配置的步骤
    const configurableSteps = Object.entries(flow?.steps || {})
      .map(([stepKey, stepDefinition]) => {
        const actionStep = stepDefinition as ActionStepDefinition;

        // 从step获取uiSchema（如果存在）
        const stepUiSchema = actionStep.uiSchema || {};

        // 如果step使用了action，也获取action的uiSchema
        let actionUiSchema = {};
        if (actionStep.use) {
          const action = model.flowEngine?.getAction?.(actionStep.use);
          if (action && action.uiSchema) {
            actionUiSchema = action.uiSchema;
          }
        }

        // 合并uiSchema，确保step的uiSchema优先级更高
        const mergedUiSchema = { ...actionUiSchema };

        // 将stepUiSchema中的字段合并到mergedUiSchema
        Object.entries(stepUiSchema).forEach(([fieldKey, schema]) => {
          if (mergedUiSchema[fieldKey]) {
            mergedUiSchema[fieldKey] = { ...mergedUiSchema[fieldKey], ...schema };
          } else {
            mergedUiSchema[fieldKey] = schema;
          }
        });

        // 如果没有可配置的UI Schema，返回null
        if (Object.keys(mergedUiSchema).length === 0) {
          return null;
        }

        return { stepKey, step: actionStep, uiSchema: mergedUiSchema };
      })
      .filter(Boolean);

    // 获取初始参数（从model中获取，但不直接绑定）
    const getInitialParams = useCallback(() => {
      const params = {};

      // 从model中获取每个步骤的参数，如果为空则使用默认参数
      configurableSteps.forEach(({ stepKey, step }) => {
        const stepParams = model.getStepParams(flowKey, stepKey) || {};
        const defaultParams = step.defaultParams || {};

        // 合并默认参数和当前参数，当前参数优先
        const mergedParams = { ...defaultParams, ...stepParams };

        if (Object.keys(mergedParams).length > 0) {
          params[stepKey] = mergedParams;
        }
      });

      return params;
    }, [model, flowKey, configurableSteps]);

    // 初始化表单值（只在组件挂载时执行一次）
    useEffect(() => {
      const initialParams = getInitialParams();
      setTempValues(initialParams);
      form.setFieldsValue(initialParams);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flowKey, form]);

    // 处理表单值变化（更新临时状态，不保存到model）
    const handleValuesChange = useCallback((changedValues: any, allValues: any) => {
      setTempValues(allValues);
    }, []);

    // 处理保存（用于确认按钮触发）
    const handleSave = useCallback(async () => {
      try {
        const values = await form.validateFields();

        // 保存到model
        Object.entries(values).forEach(([stepKey, stepValues]: [string, any]) => {
          if (stepValues && typeof stepValues === 'object') {
            // 使用setStepParams保存步骤参数
            model.setStepParams(flowKey, stepKey, stepValues);
          }
        });

        // 调用外部保存回调
        onSave?.(values);
      } catch (error) {
        console.error('表单验证失败:', error);
        onError?.(error);
      }
    }, [form, model, flowKey, onSave, onError]);

    // 处理取消
    const handleCancel = useCallback(() => {
      // 重置表单到初始值
      const initialParams = getInitialParams();
      setTempValues(initialParams);
      form.setFieldsValue(initialParams);
      onCancel?.();
    }, [form, getInitialParams, onCancel]);

    // 监听shouldSave变化，自动触发保存
    useEffect(() => {
      if (shouldSave && shouldSave !== lastShouldSave) {
        setLastShouldSave(shouldSave);
        handleSave();
      }
    }, [shouldSave, lastShouldSave, handleSave]);

    if (!flow) {
      return <Alert message={`未找到Key为 ${flowKey} 的流程`} type="error" />;
    }

    if (configurableSteps.length === 0) {
      return <Alert message="此流程没有可配置的参数" type="info" />;
    }

    // 渲染表单字段
    const renderFormFields = () => {
      return configurableSteps.map(({ stepKey, uiSchema }) => {
        return Object.entries(uiSchema).map(([fieldKey, schema]: [string, any]) => {
          const fieldName = `${stepKey}.${fieldKey}`;

          // 根据schema类型渲染不同的组件
          const renderField = () => {
            switch (schema['x-component']) {
              case 'Select':
                return (
                  <Select
                    placeholder={schema['x-component-props']?.placeholder || `请选择${schema.title}`}
                    options={schema.enum || []}
                    {...(schema['x-component-props'] || {})}
                  />
                );
              case 'InputNumber':
                return (
                  <InputNumber
                    placeholder={schema['x-component-props']?.placeholder || `请输入${schema.title}`}
                    {...(schema['x-component-props'] || {})}
                  />
                );
              case 'Switch':
                return <Switch {...(schema['x-component-props'] || {})} />;
              case 'Input.TextArea':
                return (
                  <Input.TextArea
                    placeholder={schema['x-component-props']?.placeholder || `请输入${schema.title}`}
                    {...(schema['x-component-props'] || {})}
                  />
                );
              default:
                return (
                  <Input
                    placeholder={schema['x-component-props']?.placeholder || `请输入${schema.title}`}
                    {...(schema['x-component-props'] || {})}
                  />
                );
            }
          };

          return (
            <Form.Item
              key={fieldName}
              name={[stepKey, fieldKey]}
              label={schema.title || fieldKey}
              rules={schema.required ? [{ required: true, message: `请输入${schema.title || fieldKey}` }] : []}
            >
              {renderField()}
            </Form.Item>
          );
        });
      });
    };

    return (
      <div>
        <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
          {renderFormFields()}

          {showActions && (
            <Form.Item>
              <Space>
                <Button type="primary" onClick={handleSave}>
                  保存
                </Button>
                <Button onClick={handleCancel}>取消</Button>
              </Space>
            </Form.Item>
          )}
        </Form>
      </div>
    );
  },
);

// 使用传入的model
const FlowSettingsWithModel: React.FC<ModelProvidedProps> = observer(
  ({ model, flowKey, onSave, onCancel, onError, shouldSave, showActions = false }) => {
    if (!model) {
      return <Alert message="提供的模型无效" type="error" />;
    }

    return (
      <FlowSettingsContent
        model={model}
        flowKey={flowKey}
        onSave={onSave}
        onCancel={onCancel}
        onError={onError}
        shouldSave={shouldSave}
        showActions={showActions}
      />
    );
  },
);

// 通过useModelById hook获取model
const FlowSettingsWithModelById: React.FC<ModelByIdProps> = observer(
  ({ uid, modelClassName, flowKey, onSave, onCancel, onError, shouldSave, showActions = false }) => {
    const model = useFlowModel(uid, modelClassName);

    if (!model) {
      return <Alert message={`未找到ID为 ${uid} 的模型`} type="error" />;
    }

    return (
      <FlowSettingsContent
        model={model}
        flowKey={flowKey}
        onSave={onSave}
        onCancel={onCancel}
        onError={onError}
        shouldSave={shouldSave}
        showActions={showActions}
      />
    );
  },
);

/**
 * FlowSettings组件 - 单个流程的详细配置表单（contextual版本）
 *
 * 特点：
 * - 支持临时状态管理
 * - 只有在调用onSave时才保存到model
 * - 适用于弹窗等需要确认操作的场景
 *
 * 支持两种使用方式：
 * 1. 直接提供model: <FlowSettings model={myModel} flowKey="workflow1" onSave={handleSave} />
 * 2. 通过uid和modelClassName获取model: <FlowSettings uid="model1" modelClassName="MyModel" flowKey="workflow1" onSave={handleSave} />
 *
 * @param props.onSave 保存回调函数，接收表单值作为参数
 * @param props.onCancel 取消回调函数
 * @param props.onError 错误回调函数
 * @param props.shouldSave 是否应该保存，用于外部触发保存
 * @param props.showActions 是否显示操作按钮，默认为false
 */
const FlowSettings: React.FC<FlowSettingsProps> = (props) => {
  if (isModelByIdProps(props)) {
    return <FlowSettingsWithModelById {...props} />;
  } else {
    return <FlowSettingsWithModel {...props} />;
  }
};

export default FlowSettings;
