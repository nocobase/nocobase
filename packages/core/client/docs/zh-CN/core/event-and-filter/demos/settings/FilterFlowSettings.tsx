import React, { useEffect } from 'react';
import { Card, Empty, Alert, Input, InputNumber, Select, Switch, Form } from 'antd';
import { useObservableModel, useFilterFlow, ConfigFilterFlowStep } from '@nocobase/client';
import { observer } from '@formily/react';

const { Item: FormItem } = Form;

interface FilterFlowSettingsProps {
  uid: string;
  flowKey: string;
}

/**
 * FilterFlowSettings组件 - 自动渲染流程步骤的配置界面
 * @param uid - 模型的唯一标识符
 * @param flowKey - 流程的key
 */
const FilterFlowSettings: React.FC<FilterFlowSettingsProps> = observer(({ uid, flowKey }) => {
  const filterFlowManager = useFilterFlow();
  const model = useObservableModel(uid);

  if (!filterFlowManager) {
    return <Alert message="filterFlowManager未初始化" type="error" />;
  }

  if (!model) {
    return <Alert message={`未找到ID为 ${uid} 的模型`} type="error" />;
  }

  const flow = filterFlowManager.getFlow(flowKey);
  if (!flow) {
    return <Alert message={`未找到Key为 ${flowKey} 的流程`} type="error" />;
  }

  const steps = flow.getSteps();
  if (steps.length === 0) {
    return <Empty description="此流程没有配置步骤" />;
  }

  // 更新模型的FilterParams
  const updateModelValue = (stepKey, filterKey, fieldKey, value) => {
    const currentParams = model.filterParams[flowKey]?.[stepKey] || {};
    model.setFilterParams(flowKey, stepKey, {
      ...currentParams,
      [fieldKey]: value
    });
  };

  // 渲染表单控件
  const renderFormField = (field, fieldSchema, stepKey, filterName) => {
    const filterParams = model.filterParams[flowKey]?.[stepKey] || {};
    const fieldValue = filterParams[field] !== undefined ? filterParams[field] : (fieldSchema.default || '');
    
    // 根据字段类型渲染不同控件
    switch (fieldSchema.type) {
      case 'string':
        if (fieldSchema['x-component'] === 'Select') {
          const options = fieldSchema.enum || [];
          return (
            <Select
              value={fieldValue}
              onChange={(value) => updateModelValue(stepKey, filterName, field, value)}
              placeholder={fieldSchema.title || field}
              style={{ width: '100%' }}
              options={options}
            />
          );
        }
        
        if (fieldSchema['x-component'] === 'Input.TextArea') {
          return (
            <Input.TextArea
              value={fieldValue}
              onChange={(e) => updateModelValue(stepKey, filterName, field, e.target.value)}
              placeholder={fieldSchema.title || field}
              rows={fieldSchema['x-component-props']?.rows || 3}
            />
          );
        }
        
        return (
          <Input
            value={fieldValue}
            onChange={(e) => updateModelValue(stepKey, filterName, field, e.target.value)}
            placeholder={fieldSchema.title || field}
          />
        );
        
      case 'number':
        return (
          <InputNumber
            value={fieldValue}
            onChange={(value) => updateModelValue(stepKey, filterName, field, value)}
            placeholder={fieldSchema.title || field}
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
            onChange={(checked) => updateModelValue(stepKey, filterName, field, checked)}
          />
        );
        
      default:
        return null;
    }
  };

  // 获取所有可配置的步骤和对应的过滤器
  const validSteps = steps
    .filter(step => step instanceof ConfigFilterFlowStep) // 使用instanceof进行类型检查
    .map(step => {
      const configStep = step as ConfigFilterFlowStep;
      const filter = filterFlowManager.getFilter(configStep.filterName);
      if (!filter || !filter.uiSchema) return null;
      return { step: configStep, filter };
    })
    .filter(Boolean);

  if (validSteps.length === 0) {
    return <Empty description="没有可配置的步骤" />;
  }

  return (
    <Card title={`${flow.title || flow.key}`}>
      <Form layout="vertical">
        {validSteps.map(({ step, filter }) => {
          const uiSchema = filter.uiSchema;
          return Object.entries(uiSchema).map(([field, fieldSchema]) => (
            <FormItem 
              key={`${step.key}-${field}`}
              label={
                <span>
                  {step.title && <span style={{ color: '#8c8c8c' }}>[{step.title}] </span>}
                  {fieldSchema.title || field}
                </span>
              }
              tooltip={fieldSchema.description}
            >
              {renderFormField(field, fieldSchema, step.key, step.filterName)}
            </FormItem>
          ));
        })}
      </Form>
    </Card>
  );
});

export default FilterFlowSettings;
