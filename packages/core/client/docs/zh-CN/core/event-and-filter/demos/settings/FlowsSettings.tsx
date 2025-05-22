import React from 'react';
import { Card, Empty, Alert, Collapse } from 'antd';
import { ActionStepDefinition, FlowEngine, FlowModel } from '@nocobase/client';
import { observer } from '@formily/react';
import FlowSettings from './FlowSettings';

const { useFlowModel: useModelById } = FlowEngine;
const { Panel } = Collapse;

// 创建两个组件版本，一个使用props传递的model，一个使用hook获取model
interface ModelProvidedProps {
  model: any;
  expandAll?: boolean; // 是否展开所有Collapse
}

interface ModelByIdProps {
  uid: string;
  modelClassName: string;
  expandAll?: boolean; // 是否展开所有Collapse
}

type FlowsSettingsProps = ModelProvidedProps | ModelByIdProps;

// 判断是否是通过ID获取模型的props
const isModelByIdProps = (props: FlowsSettingsProps): props is ModelByIdProps => {
  return 'uid' in props && 'modelClassName' in props && Boolean(props.uid) && Boolean(props.modelClassName);
};

/**
 * FlowsSettings组件 - 渲染多个流程的配置界面
 * 支持两种使用方式：
 * 1. 直接提供model: <FlowsSettings model={myModel} expandAll={true} />
 * 2. 通过uid和modelClassName获取model: <FlowsSettings uid="model1" modelClassName="MyModel" expandAll={true} />
 * @param props.expandAll 是否展开所有Collapse，默认为false
 */
const FlowsSettings: React.FC<FlowsSettingsProps> = (props) => {
  if (isModelByIdProps(props)) {
    return <FlowsSettingsWithModelById {...props} />;
  } else {
    return <FlowsSettingsWithModel {...props} />;
  }
};

// 使用传入的model
const FlowsSettingsWithModel: React.FC<ModelProvidedProps> = observer(({ model, expandAll }) => {
  if (!model) {
    return <Alert message="提供的模型无效" type="error" />;
  }

  return <FlowsSettingsContent model={model} expandAll={expandAll} />;
});

// 通过useModelById hook获取model
const FlowsSettingsWithModelById: React.FC<ModelByIdProps> = observer(({ uid, modelClassName, expandAll }) => {
  const model = useModelById(uid, modelClassName);
  
  if (!model) {
    return <Alert message={`未找到ID为 ${uid} 的模型`} type="error" />;
  }

  return <FlowsSettingsContent model={model} expandAll={expandAll} />;
});

// 提取核心渲染逻辑到一个共享组件
interface FlowsSettingsContentProps {
  model: FlowModel;
  expandAll?: boolean;
}

// 默认使用 Collapse 组件渲染多个流程设置
const FlowsSettingsContent: React.FC<FlowsSettingsContentProps> = observer(({ model, expandAll = false }) => {
  const ModelClass = model.constructor as typeof FlowModel;
  const flows = ModelClass.getFlows();

  const filterFlows = Array.from(flows.values()).filter((flow) => {
    const configurableSteps = Object.entries(flow.steps)
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
    return configurableSteps.length > 0;
  });
  
  const flowKeys = filterFlows.map((flow) => flow.key);
  if (flowKeys.length === 0) {
    return <Empty description="没有可用的流程" />;
  }

  // 如果expandAll为true，则默认展开所有面板
  const defaultActiveKey = expandAll ? flowKeys : undefined;


  return (
    <Card title="Flows设置">
      <Collapse defaultActiveKey={defaultActiveKey}>
        {flowKeys.map(flowKey => (
          <Panel header={flows.get(flowKey)?.title || flowKey} key={flowKey}>
            <FlowSettings model={model} flowKey={flowKey} />
          </Panel>
        ))}
      </Collapse>
    </Card>
  );
});

export default FlowsSettings;
