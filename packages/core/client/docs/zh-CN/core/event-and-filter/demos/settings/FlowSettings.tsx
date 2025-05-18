import React from 'react';
import { Card, Empty, Alert, Input, InputNumber, Select, Switch, Form } from 'antd';
import { useModel, useFlowEngine } from '@nocobase/client';
import { ActionStepDefinition } from '@nocobase/client';
import { observer } from '@formily/react';

const { Item: FormItem } = Form;

interface FlowSettingsProps {
  uid: string;
  flowKey: string;
  modelClassName: string;
}

/**
 * FlowSettings组件 - 自动渲染流程步骤的配置界面 (Adapted for FlowEngine)
 * @param uid - 模型的唯一标识符
 * @param flowKey - 流程的key
 */
const FlowSettings: React.FC<FlowSettingsProps> = observer(({ uid, flowKey, modelClassName }) => {
  const flowEngine = useFlowEngine();
  const model = useModel(modelClassName, uid);

  if (!flowEngine) {
    return <Alert message="flowEngine未初始化" type="error" />;
  }

  if (!model) {
    return <Alert message={`未找到ID为 ${uid} 的模型`} type="error" />;
  }

  const flow = flowEngine.getFlow(flowKey);
  if (!flow) {
    return <Alert message={`未找到Key为 ${flowKey} 的流程`} type="error" />;
  }

  const steps = flow.steps;
  if (steps.length === 0) {
    return <Empty description="此流程没有配置步骤" />;
  }

  const updateModelValue = (stepKey: string, fieldKey: string, value: any) => {
    const currentParams = model.getStepParams(flowKey, stepKey) || {};
    model.setStepParams(flowKey, stepKey, {
      ...currentParams,
      [fieldKey]: value
    });
  };

  const renderFormField = (fieldKey: string, fieldSchema: any, stepKey: string) => {
    const stepRuntimeParams = model.getStepParams(flowKey, stepKey) || {};
    const fieldValue = stepRuntimeParams[fieldKey] !== undefined 
        ? stepRuntimeParams[fieldKey] 
        : (fieldSchema.default !== undefined ? fieldSchema.default : '');
    
    switch (fieldSchema.type) {
      case 'string':
        if (fieldSchema['x-component'] === 'Select') {
          const options = fieldSchema.enum || [];
          return (
            <Select
              value={fieldValue}
              onChange={(value) => updateModelValue(stepKey, fieldKey, value)}
              placeholder={fieldSchema.title || fieldKey}
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
              placeholder={fieldSchema.title || fieldKey}
              rows={fieldSchema['x-component-props']?.rows || 3}
            />
          );
        }
        return (
          <Input
            value={fieldValue}
            onChange={(e) => updateModelValue(stepKey, fieldKey, e.target.value)}
            placeholder={fieldSchema.title || fieldKey}
          />
        );
      case 'number':
        return (
          <InputNumber
            value={fieldValue}
            onChange={(value) => updateModelValue(stepKey, fieldKey, value)}
            placeholder={fieldSchema.title || fieldKey}
            style={{ width: '100%' }}
            min={fieldSchema['x-component-props']?.min}
            max={fieldSchema['x-component-props']?.max}
            addonAfter={fieldSchema['x-component-props']?.addonAfter}
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

  const configurableSteps = steps
    .filter(step => (step as ActionStepDefinition).use)
    .map(step => {
      const actionStep = step as ActionStepDefinition;
      const action = flowEngine.getAction(actionStep.use);
      if (!action || !action.uiSchema) return null;
      return { step: actionStep, uiSchema: action.uiSchema };
    })
    .filter(Boolean);

  if (configurableSteps.length === 0) {
    return <Empty description="没有可配置参数的步骤" />;
  }

  return (
    <Card title={`${flow.title || flow.key} - 设置`}>
      <Form layout="vertical">
        {configurableSteps.map(({ step, uiSchema }) => {
          return Object.entries(uiSchema || {}).map(([fieldKey, fieldSchema]: [string, any]) => (
            <FormItem 
              key={`${step.key}-${fieldKey}`}
              label={
                <span>
                  {step.title && <span style={{ color: '#8c8c8c' }}>[{step.title}] </span>}
                  {fieldSchema.title || fieldKey}
                </span>
              }
              tooltip={fieldSchema.description}
            >
              {renderFormField(fieldKey, fieldSchema, step.key!)}
            </FormItem>
          ));
        })}
      </Form>
    </Card>
  );
});

export default FlowSettings;
