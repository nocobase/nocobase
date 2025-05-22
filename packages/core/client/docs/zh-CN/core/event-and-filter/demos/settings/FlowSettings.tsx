import React from 'react';
import { Card, Empty, Alert, Input, InputNumber, Select, Switch, Form } from 'antd';
import { useFlowEngine, ActionStepDefinition, ISchema, FlowEngine } from '@nocobase/client';
import { observer } from '@formily/react';

const { Item: FormItem } = Form;

const { useFlowModel: useModelById } = FlowEngine;

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
 * FlowSettings组件 - 自动渲染流程步骤的配置界面 (Adapted for FlowEngine)
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
  const flowEngine = model?.flowEngine;
  
  if (!model) {
    return <Alert message="提供的模型无效" type="error" />;
  }

  return <FlowSettingsContent model={model} flowKey={flowKey} flowEngine={flowEngine} />;
});

// 通过useModelById hook获取model
const FlowSettingsWithModelById: React.FC<ModelByIdProps> = observer(({ uid, flowKey, modelClassName }) => {
  const model = useModelById(uid, modelClassName);
  const flowEngine = model?.flowEngine;
  
  if (!model) {
    return <Alert message={`未找到ID为 ${uid} 的模型`} type="error" />;
  }

  return <FlowSettingsContent model={model} flowKey={flowKey} flowEngine={flowEngine} />;
});

// 提取核心渲染逻辑到一个共享组件
interface FlowSettingsContentProps {
  model: any;
  flowKey: string;
  flowEngine: any;
}

const FlowSettingsContent: React.FC<FlowSettingsContentProps> = observer(({ model, flowKey, flowEngine }) => {
  const flow = model.getFlow(flowKey);
  if (!flow || !flow.steps) {
    return <Alert message={`未找到Key为 ${flowKey} 的流程或流程没有步骤`} type="error" />;
  }

  const updateModelValue = (stepKey: string, fieldKey: string, value: any) => {
    const currentParams = model.getStepParams(flowKey, stepKey) || {};
    model.setStepParams(flowKey, stepKey, {
      ...currentParams,
      [fieldKey]: value
    });
  };

  const renderFormField = (fieldKey: string, fieldSchema: ISchema, stepKey: string) => {
    const stepRuntimeParams = model.getStepParams(flowKey, stepKey) || {};
    
    // 获取对应步骤的定义
    const stepDefinition = flow.steps[stepKey] as ActionStepDefinition;
    
    // 根据优先级获取字段值：
    // 1. 用户设置的参数值 (stepRuntimeParams)
    // 2. 步骤定义的默认参数值 (defaultParams)
    const stepDefaultParams = stepDefinition.defaultParams || {};
    const fieldValue = stepRuntimeParams[fieldKey] !== undefined 
        ? stepRuntimeParams[fieldKey] 
        : (stepDefaultParams[fieldKey] !== undefined 
            ? stepDefaultParams[fieldKey]
            : (fieldSchema.default !== undefined ? fieldSchema.default : ''));
    
    switch (fieldSchema.type) {
      case 'string':
        if (fieldSchema['x-component'] === 'Select') {
          const options = (fieldSchema.enum as any[]) || [];
          return (
            <Select
              value={fieldValue}
              onChange={(value) => updateModelValue(stepKey, fieldKey, value)}
              placeholder={fieldSchema.title as string || fieldKey}
              style={{ width: '100%' }}
              options={options}
            />
          );
        }
        if (fieldSchema['x-component'] === 'Input.TextArea') {
          return (
            <Input.TextArea
              value={fieldValue}
              onChange={(e) => updateModelValue(stepKey, fieldKey, e.target.value)}
              placeholder={fieldSchema.title as string || fieldKey}
              rows={(fieldSchema['x-component-props'] as any)?.rows || 3}
            />
          );
        }
        return (
          <Input
            value={fieldValue}
            onChange={(e) => updateModelValue(stepKey, fieldKey, e.target.value)}
            placeholder={fieldSchema.title as string || fieldKey}
          />
        );
      case 'number':
        return (
          <InputNumber
            value={fieldValue}
            onChange={(value) => updateModelValue(stepKey, fieldKey, value)}
            placeholder={fieldSchema.title as string || fieldKey}
            style={{ width: '100%' }}
            min={(fieldSchema['x-component-props'] as any)?.min}
            max={(fieldSchema['x-component-props'] as any)?.max}
            addonAfter={(fieldSchema['x-component-props'] as any)?.addonAfter}
          />
        );
      case 'boolean':
        return (
          <Switch
            checked={!!fieldValue}
            onChange={(checked) => updateModelValue(stepKey, fieldKey, checked)}
          />
        );
      default:
        console.warn(`Unsupported field type: ${fieldSchema.type} for field ${fieldKey}`);
        return <Input disabled placeholder={`Unsupported type: ${fieldSchema.type}`} />;
    }
  };

  const configurableSteps = Object.entries(flow.steps)
    .map(([stepKey, stepDefinition]) => {
      const actionStep = stepDefinition as ActionStepDefinition;
      
      // 从step获取uiSchema（如果存在）
      const stepUiSchema = actionStep.uiSchema || {};
      
      // 如果step使用了action，也获取action的uiSchema
      let actionUiSchema = {};
      if (actionStep.use) {
        const action = flowEngine?.getAction?.(actionStep.use);
        if (action && action.uiSchema) {
          actionUiSchema = action.uiSchema;
        }
      }
      
      // 合并uiSchema，确保step的uiSchema优先级更高
      // 先复制action的uiSchema，然后用step的uiSchema覆盖相同的字段
      const mergedUiSchema = { ...actionUiSchema };
      
      // 将stepUiSchema中的字段合并到mergedUiSchema
      Object.entries(stepUiSchema).forEach(([fieldKey, schema]) => {
        if (mergedUiSchema[fieldKey]) {
          // 如果字段已存在，则合并schema对象，保持step中的属性优先级更高
          mergedUiSchema[fieldKey] = { ...mergedUiSchema[fieldKey], ...schema };
        } else {
          // 如果字段不存在，则直接添加
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

  if (configurableSteps.length === 0) {
    // return <Empty description="没有可配置参数的步骤" />;
    return null;
  }

  return (
    <Card title={`${flow.title || flow.key} - 设置`}>
      <Form layout="vertical">
        {configurableSteps.map(({ stepKey, step, uiSchema }) => {
          return Object.entries(uiSchema).map(([fieldKey, fieldSchema]: [string, ISchema]) => {
            const currentFieldSchema = fieldSchema as ISchema;
            return (
              <FormItem 
                key={`${stepKey}-${fieldKey}`}
                label={
                  <span>
                    {step.title && <span style={{ color: '#8c8c8c' }}>[{step.title}] </span>}
                    {currentFieldSchema.title as string || fieldKey}
                  </span>
                }
                tooltip={currentFieldSchema.description as string}
              >
                {renderFormField(fieldKey, currentFieldSchema, stepKey)}
              </FormItem>
            );
          });
        })}
      </Form>
    </Card>
  );
});

export default FlowSettings;
