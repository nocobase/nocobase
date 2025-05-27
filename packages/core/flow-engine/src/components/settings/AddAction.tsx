import React, { useState } from 'react';
import { Alert, Button, Select, Space } from 'antd';
import { useFlowModel } from '../../hooks';
import { BlockModel } from '../../models';
import { observer } from '@formily/react';
import { PlusOutlined } from '@ant-design/icons';

// 创建两个组件版本，一个使用props传递的model，一个使用hook获取model
interface ModelProvidedProps {
  model: BlockModel;
  expandAll?: boolean; // 是否展开所有Collapse
}

interface ModelByIdProps {
  uid: string;
  modelClassName: string;
  expandAll?: boolean; // 是否展开所有Collapse
}

type AddActionProps = ModelProvidedProps | ModelByIdProps;

// 判断是否是通过ID获取模型的props
const isModelByIdProps = (props: AddActionProps): props is ModelByIdProps => {
  return 'uid' in props && 'modelClassName' in props && Boolean(props.uid) && Boolean(props.modelClassName);
};

/**
 * AddAction 组件 - 添加 Block 模型的 Action
 * 支持两种使用方式：
 * 1. 直接提供model: <AddAction model={myModel} expandAll={true} />
 * 2. 通过uid和modelClassName获取model: <AddAction uid="model1" modelClassName="MyModel" expandAll={true} />
 */
const AddAction: React.FC<AddActionProps> = (props) => {
  if (isModelByIdProps(props)) {
    return <AddActionWithModelById {...props} />;
  } else {
    return <AddActionWithModel {...props} />;
  }
};

// 使用传入的model
const AddActionWithModel: React.FC<ModelProvidedProps> = observer(({ model }) => {
  if (!model) {
    return <Alert message="提供的模型无效" type="error" />;
  }

  return <AddActionForm model={model} />;
});

// 通过useModelById hook获取model
const AddActionWithModelById: React.FC<ModelByIdProps> = observer(({ uid, modelClassName }) => {
  const model = useFlowModel(uid, modelClassName) as BlockModel;

  if (!model) {
    return <Alert message={`未找到ID为 ${uid} 的模型`} type="error" />;
  }

  return <AddActionForm model={model} />;
});

// 添加新Action的表单组件
const AddActionForm: React.FC<{ model: BlockModel }> = observer(({ model }) => {
  const [selectedActionType, setSelectedActionType] = useState<string | null>(null);
  const ModelClass = model.constructor as typeof BlockModel;
  const supportedActions = ModelClass.supportedActions;

  // 处理添加Action
  const handleAdd = () => {
    if (!selectedActionType) return;

    // 找到选中的Action类型
    const actionConfig = supportedActions.find((action) => action.type.name === selectedActionType);

    if (actionConfig) {
      // 创建新的Action实例
      const newActionUid = `${model.uid}_action_${Date.now()}`;
      const newAction = new actionConfig.type({
        uid: newActionUid,
        stepParams: model.stepParams,
        blockModel: model,
      });
      newAction.setFlowEngine(model.flowEngine);

      // 添加到模型中
      model.addAction(newAction);

      // 重置选择
      setSelectedActionType(null);
    }
  };

  return (
    <Space direction="horizontal" style={{ marginBottom: 16 }}>
      <Select
        placeholder="选择要添加的操作类型"
        style={{ width: 200 }}
        value={selectedActionType}
        onChange={setSelectedActionType}
        options={supportedActions.map((action) => ({
          label: action.title,
          value: action.type.name,
        }))}
      />
      <Button type="primary" icon={<PlusOutlined />} disabled={!selectedActionType} onClick={handleAdd}>
        添加操作
      </Button>
    </Space>
  );
});

export { AddAction };
