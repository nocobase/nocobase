import React, { useState } from 'react';
import { Menu, Alert, Empty } from 'antd';
import { SettingOutlined, MenuOutlined } from '@ant-design/icons';
import { FlowEngine, FlowModel, ActionStepDefinition, useFlowModel } from '@nocobase/client';
import { observer } from '@formily/react';
import FlowSettingsModal from './FlowSettingsModal';

// 创建两个组件版本，一个使用props传递的model，一个使用hook获取model
interface ModelProvidedProps {
  model: any;
  menuMode?: 'vertical' | 'horizontal' | 'inline'; // 菜单模式
  style?: React.CSSProperties; // 菜单样式
}

interface ModelByIdProps {
  uid: string;
  modelClassName: string;
  menuMode?: 'vertical' | 'horizontal' | 'inline'; // 菜单模式
  style?: React.CSSProperties; // 菜单样式
}

type FlowsMenusProps = ModelProvidedProps | ModelByIdProps;

// 判断是否是通过ID获取模型的props
const isModelByIdProps = (props: FlowsMenusProps): props is ModelByIdProps => {
  return 'uid' in props && 'modelClassName' in props && Boolean(props.uid) && Boolean(props.modelClassName);
};

/**
 * FlowsMenus组件 - 以菜单形式展示多个流程的配置入口
 * 支持两种使用方式：
 * 1. 直接提供model: <FlowsMenus model={myModel} menuMode="vertical" />
 * 2. 通过uid和modelClassName获取model: <FlowsMenus uid="model1" modelClassName="MyModel" menuMode="horizontal" />
 * @param props.menuMode 菜单模式，默认为'vertical'
 * @param props.style 菜单样式
 */
const FlowsMenus: React.FC<FlowsMenusProps> = (props) => {
  if (isModelByIdProps(props)) {
    return <FlowsMenusWithModelById {...props} />;
  } else {
    return <FlowsMenusWithModel {...props} />;
  }
};

// 使用传入的model
const FlowsMenusWithModel: React.FC<ModelProvidedProps> = observer(({ model, menuMode = 'vertical', style }) => {
  if (!model) {
    return <Alert message="提供的模型无效" type="error" />;
  }

  return <FlowsMenusContent model={model} menuMode={menuMode} style={style} />;
});

// 通过useModelById hook获取model
const FlowsMenusWithModelById: React.FC<ModelByIdProps> = observer(({ uid, modelClassName, menuMode = 'vertical', style }) => {
  const model = useFlowModel(uid, modelClassName);
  
  if (!model) {
    return <Alert message={`未找到ID为 ${uid} 的模型`} type="error" />;
  }

  return <FlowsMenusContent model={model} menuMode={menuMode} style={style} />;
});

// 提取核心渲染逻辑到一个共享组件
interface FlowsMenusContentProps {
  model: FlowModel;
  menuMode: 'vertical' | 'horizontal' | 'inline';
  style?: React.CSSProperties;
}

const FlowsMenusContent: React.FC<FlowsMenusContentProps> = observer(({ model, menuMode, style }) => {
  const [selectedFlowKey, setSelectedFlowKey] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const ModelClass = model.constructor as typeof FlowModel;
  const flows = ModelClass.getFlows();

  // 过滤出有可配置步骤的流程
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
    return configurableSteps.length > 0;
  });

  if (filterFlows.length === 0) {
    return <Empty description="没有可配置的流程" />;
  }

  // 处理菜单项点击
  const handleMenuClick = ({ key }: { key: string }) => {
    setSelectedFlowKey(key);
    setModalVisible(true);
  };

  // 关闭弹窗
  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedFlowKey(null);
  };

  // 构建菜单项
  const menuItems = filterFlows.map((flow) => ({
    key: flow.key,
    icon: <SettingOutlined />,
    label: flow.title || flow.key,
  }));

  return (
    <>
      <Menu
        mode={menuMode}
        style={style}
        items={menuItems}
        onClick={handleMenuClick}
        selectable={false}
      />
      
      {/* 设置弹窗 */}
      {selectedFlowKey && (
        <FlowSettingsModal
          model={model}
          flowKey={selectedFlowKey}
          visible={modalVisible}
          onClose={handleModalClose}
        />
      )}
    </>
  );
});

export default FlowsMenus; 