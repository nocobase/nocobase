import React, { useState } from 'react';
import { Card, Empty, Alert, Collapse, Button, Select, Space, Popconfirm, Typography } from 'antd';
import { BlockModel, ActionModel, FlowEngine, useFlowModel } from '@nocobase/client';
import { observer } from '@formily/react';
import FlowsSettings from './simple/FlowsSettings';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
const { Panel } = Collapse;
const { Text } = Typography;

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

type ActionsSettingsProps = ModelProvidedProps | ModelByIdProps;

// 判断是否是通过ID获取模型的props
const isModelByIdProps = (props: ActionsSettingsProps): props is ModelByIdProps => {
  return 'uid' in props && 'modelClassName' in props && Boolean(props.uid) && Boolean(props.modelClassName);
};

/**
 * ActionsSettings 组件 - 渲染 Block 模型的 Actions 配置界面
 * 支持两种使用方式：
 * 1. 直接提供model: <ActionsSettings model={myModel} expandAll={true} />
 * 2. 通过uid和modelClassName获取model: <ActionsSettings uid="model1" modelClassName="MyModel" expandAll={true} />
 */
const ActionsSettings: React.FC<ActionsSettingsProps> = (props) => {
  if (isModelByIdProps(props)) {
    return <ActionsSettingsWithModelById {...props} />;
  } else {
    return <ActionsSettingsWithModel {...props} />;
  }
};

// 使用传入的model
const ActionsSettingsWithModel: React.FC<ModelProvidedProps> = observer(({ model, expandAll }) => {
  if (!model) {
    return <Alert message="提供的模型无效" type="error" />;
  }

  return <ActionsSettingsContent model={model} expandAll={expandAll} />;
});

// 通过useModelById hook获取model
const ActionsSettingsWithModelById: React.FC<ModelByIdProps> = observer(({ uid, modelClassName, expandAll }) => {
  const model = useFlowModel(uid, modelClassName) as BlockModel;
  
  if (!model) {
    return <Alert message={`未找到ID为 ${uid} 的模型`} type="error" />;
  }

  return <ActionsSettingsContent model={model} expandAll={expandAll} />;
});

// 添加新Action的组件
const AddAction: React.FC<{ model: BlockModel; onAdd: () => void }> = observer(({ model, onAdd }) => {
  const [selectedActionType, setSelectedActionType] = useState<string | null>(null);
  const ModelClass = model.constructor as typeof BlockModel;
  const supportedActions = ModelClass.supportedActions;

  // 处理添加Action
  const handleAdd = () => {
    if (!selectedActionType) return;
    
    // 找到选中的Action类型
    const actionConfig = supportedActions.find(action => 
      action.type.name === selectedActionType
    );
    
    if (actionConfig) {
      // 创建新的Action实例
      const newActionUid = `${model.uid}_action_${Date.now()}`;
      const newAction = new actionConfig.type(newActionUid, model.app);
      
      // 添加到模型中
      model.addAction(newAction);
      
      // 重置选择
      setSelectedActionType(null);
      
      // 通知父组件刷新
      onAdd();
    }
  };

  return (
    <Space direction="horizontal" style={{ marginBottom: 16 }}>
      <Select
        placeholder="选择要添加的操作类型"
        style={{ width: 200 }}
        value={selectedActionType}
        onChange={setSelectedActionType}
        options={supportedActions.map(action => ({
          label: action.title,
          value: action.type.name
        }))}
      />
      <Button 
        type="primary" 
        icon={<PlusOutlined />}
        disabled={!selectedActionType}
        onClick={handleAdd}
      >
        添加操作
      </Button>
    </Space>
  );
});

// Action列表项组件 - 现在只返回配置内容，不返回Panel
const ActionItem: React.FC<{ 
  action: ActionModel; 
}> = observer(({ action }) => {  
  return <FlowsSettings model={action} expandAll={true} />;
});

// 主内容渲染组件
const ActionsSettingsContent: React.FC<{
  model: BlockModel;
  expandAll?: boolean;
}> = observer(({ model, expandAll = false }) => {
  // 用于强制刷新组件
  const [, setRefresh] = useState(0);
  const forceRefresh = () => setRefresh(prev => prev + 1);

  // 获取当前模型的所有actions
  const actions = model.getActions();

  // 处理删除Action
  const handleDelete = (action: ActionModel) => {
    model.removeAction(action.uid);
    forceRefresh();
  };

  return (
    <Card title="Actions 设置">
      <AddAction model={model} onAdd={forceRefresh} />
      
      {actions.length === 0 ? (
        <Empty description="没有配置的操作" />
      ) : (
        <Collapse 
          defaultActiveKey={expandAll ? actions.map(action => action.uid) : []}
          style={{ marginTop: 16 }}
        >
          {actions.map(action => (
            <Panel
              header={
                <Text strong>{action.getFlow('onClick')?.title || '未命名操作'}</Text>
              }
              key={action.uid}
              extra={
                <Popconfirm
                  title="确定要删除此操作吗？"
                  onConfirm={() => handleDelete(action)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button 
                    type="text" 
                    danger
                    icon={<DeleteOutlined />}
                    size="small"
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popconfirm>
              }
            >
              <ActionItem action={action} />
            </Panel>
          ))}
        </Collapse>
      )}
    </Card>
  );
});

export { ActionsSettings }; 