import React, { useEffect, useState } from 'react';
import { Card, Collapse, Divider, Spin, Empty, Alert } from 'antd';
import { BaseModel, useObservableModel, useFilterFlow } from '@nocobase/client';
import { observer } from '@formily/react';
import { createForm } from '@formily/core';
import { FormProvider, FormConsumer } from '@formily/react';
import { SchemaComponent } from '@nocobase/client';

const { Panel } = Collapse;

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
  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  useEffect(() => {
    // 初始化时展开第一个面板
    if (flowKey && filterFlowManager) {
      const flow = filterFlowManager.getFlow(flowKey);
      if (flow && flow.getSteps().length > 0) {
        setActiveKeys([flow.getSteps()[0].key]);
      }
    }
  }, [flowKey, filterFlowManager]);

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
  const updateModelValue = (stepKey, filterKey, values) => {
    model.setFilterParams(flowKey, stepKey, values);
  };

  return (
    <Card title={`${flow.title || flow.key} 配置`}>
      <Collapse 
        accordion 
        activeKey={activeKeys}
        onChange={(keys) => setActiveKeys(Array.isArray(keys) ? keys : [keys])}
      >
        {steps.map((step) => {
          const filter = filterFlowManager.getFilter(step.filterName);
          if (!filter) return null;
          
          // 获取当前步骤的参数
          const filterParams = model.filterParams[flowKey]?.[step.key] || {};
          
          // 创建formily表单
          const form = createForm({
            initialValues: filterParams,
            effects() {
              // 当表单值变化时更新model
              this.onFormValuesChange((form) => {
                updateModelValue(step.key, step.filterName, form.values);
              });
            },
          });

          return (
            <Panel header={step.title || step.key} key={step.key}>
              <div style={{ padding: '8px 0' }}>
                {filter.uiSchema ? (
                  <FormProvider form={form}>
                    <SchemaComponent schema={{
                      type: 'object',
                      properties: filter.uiSchema,
                    }} />
                    <FormConsumer>
                      {() => {
                        return null; // 仅用于监听表单变化
                      }}
                    </FormConsumer>
                  </FormProvider>
                ) : (
                  <Alert 
                    message="此步骤没有配置界面" 
                    description={`过滤器 ${filter.name || filter.title} 没有定义uiSchema`}
                    type="warning" 
                    showIcon
                  />
                )}
              </div>
            </Panel>
          );
        })}
      </Collapse>
    </Card>
  );
});

export default FilterFlowSettings;
