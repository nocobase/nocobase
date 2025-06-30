/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect } from 'react';
import { Alert, Input, InputNumber, Select, Switch, Form } from 'antd';
// TODO: ISchema may need to be imported from a different package or refactored.
import { ActionStepDefinition } from '../../../../types';
import { useFlowModel } from '../../../../hooks';
import { FlowModel } from '../../../../models';
import { observer } from '@formily/react';
import { resolveDefaultParams } from '../../../../utils';

const { Item: FormItem } = Form;

// 创建两个组件版本，一个使用props传递的model，一个使用hook获取model
interface ModelProvidedProps {
  model: any;
  flowKey: string;
}

interface ModelByIdProps {
  uid: string;
  flowKey: string;
  modelClassName: string;
}

type FlowSettingsProps = ModelProvidedProps | ModelByIdProps;

// 判断是否是通过ID获取模型的props
const isModelByIdProps = (props: FlowSettingsProps): props is ModelByIdProps => {
  return 'uid' in props && 'modelClassName' in props && Boolean(props.uid) && Boolean(props.modelClassName);
};

/**
 * FlowSettings组件 - 单个流程的详细配置表单（embedded版本）
 *
 * 特点：
 * - 实时保存到model
 * - 适用于嵌入式配置界面
 *
 * 支持两种使用方式：
 * 1. 直接提供model: <FlowSettings model={myModel} flowKey="workflow1" />
 * 2. 通过uid和modelClassName获取model: <FlowSettings uid="model1" modelClassName="MyModel" flowKey="workflow1" />
 */
const FlowSettings: React.FC<FlowSettingsProps> = (props) => {
  if (isModelByIdProps(props)) {
    return <FlowSettingsWithModelById {...props} />;
  } else {
    return <FlowSettingsWithModel {...props} />;
  }
};

// 使用传入的model
const FlowSettingsWithModel: React.FC<ModelProvidedProps> = observer(({ model, flowKey }) => {
  if (!model) {
    return <Alert message="提供的模型无效" type="error" />;
  }

  return <FlowSettingsContent model={model} flowKey={flowKey} />;
});

// 通过useModelById hook获取model
const FlowSettingsWithModelById: React.FC<ModelByIdProps> = observer(({ uid, flowKey, modelClassName }) => {
  const model = useFlowModel(uid, modelClassName);

  if (!model) {
    return <Alert message={`未找到ID为 ${uid} 的模型`} type="error" />;
  }

  return <FlowSettingsContent model={model} flowKey={flowKey} />;
});

// 提取核心渲染逻辑到一个共享组件
interface FlowSettingsContentProps {
  model: FlowModel;
  flowKey: string;
}

const FlowSettingsContent: React.FC<FlowSettingsContentProps> = observer(({ model, flowKey }) => {
  const [form] = Form.useForm();

  // 获取流程定义
  const ModelClass = model.constructor as typeof FlowModel;
  const flows = ModelClass.getFlows();
  const flow = flows.get(flowKey);

  // 获取可配置的步骤
  const configurableSteps = Object.entries(flow?.steps || {})
    .map(([stepKey, stepDefinition]) => {
      const actionStep = stepDefinition as ActionStepDefinition;

      // 如果步骤设置了 hideInSettings: true，则跳过此步骤
      if (actionStep.hideInSettings) {
        return null;
      }

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

  // 获取当前流程的参数 - 从model中获取实际参数
  const getCurrentParams = useCallback(async () => {
    const params = {};

    // 创建参数解析上下文用于解析函数形式的 defaultParams
    // 在 settings 中，我们只有基本的上下文信息
    const paramsContext = {
      model,
      globals: model.flowEngine?.context || {},
      app: model.flowEngine,
    };

    // 从model中获取每个步骤的参数，如果为空则使用默认参数
    for (const { stepKey, step } of configurableSteps) {
      const stepParams = model.getStepParams(flowKey, stepKey) || {};

      // 解析 defaultParams
      const resolvedDefaultParams = await resolveDefaultParams(step.defaultParams, paramsContext);

      // 合并默认参数和当前参数，当前参数优先
      const mergedParams = { ...resolvedDefaultParams, ...stepParams };

      if (Object.keys(mergedParams).length > 0) {
        params[stepKey] = mergedParams;
      }
    }

    return params;
  }, [model, flowKey, configurableSteps]);

  // 初始化表单值
  useEffect(() => {
    const loadParams = async () => {
      try {
        const currentParams = await getCurrentParams();
        form.setFieldsValue(currentParams);
      } catch (error) {
        console.error('Error loading default params:', error);
      }
    };

    loadParams();
  }, [flowKey, form, getCurrentParams]);

  // 处理表单值变化 - 实时保存
  const handleValuesChange = useCallback(
    (changedValues: any, allValues: any) => {
      // 实时保存到model
      Object.entries(allValues).forEach(([stepKey, stepValues]: [string, any]) => {
        if (stepValues && typeof stepValues === 'object') {
          // 使用setStepParams保存步骤参数
          model.setStepParams(flowKey, stepKey, stepValues);
        }
      });
    },
    [model, flowKey],
  );

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
    <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
      {renderFormFields()}
    </Form>
  );
});

export { FlowSettings };
