import React from 'react';
import { Alert } from 'antd';
import { FlowEngine, FlowModel, useFlowModel } from '@nocobase/client';
import { observer } from '@formily/react';
import FlowsSettingsContent from './FlowsSettingsContent';

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
  const model = useFlowModel(uid, modelClassName);
  
  if (!model) {
    return <Alert message={`未找到ID为 ${uid} 的模型`} type="error" />;
  }

  return <FlowsSettingsContent model={model} expandAll={expandAll} />;
});

export default FlowsSettings;
