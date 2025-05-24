import React, { useState, useCallback } from 'react';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { observer } from '@formily/react';
import { FlowModel, ActionStepDefinition } from '@nocobase/client';
import FlowSettingsModal from './FlowSettingsModal';

interface FlowsContextMenuProps {
  model: FlowModel;
  children: React.ReactNode;
  enabled?: boolean;
  position?: 'right' | 'left';
}

const FlowsContextMenu: React.FC<FlowsContextMenuProps> = ({ 
  model, 
  children, 
  enabled = false, 
  position = 'right' 
}) => {
  const [selectedFlowKey, setSelectedFlowKey] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const handleMenuClick = useCallback(({ key }: { key: string }) => {
    setSelectedFlowKey(key);
    setModalVisible(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalVisible(false);
    setSelectedFlowKey(null);
  }, []);

  // 如果未启用或没有model，直接返回children
  if (!enabled || !model) {
    return <>{children}</>;
  }

  // 获取可配置的flows
  const getConfigurableFlows = useCallback(() => {
    try {
      const ModelClass = model.constructor as typeof FlowModel;
      const flows = ModelClass.getFlows();
      
      const flowsArray = Array.from(flows.values());
      
      return flowsArray.filter((flow) => {
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
    } catch (error) {
      console.warn('[FlowsContextMenu] 获取可配置flows失败:', error);
      return [];
    }
  }, [model]);

  const configurableFlows = getConfigurableFlows();

  // 如果没有可配置的flows，直接返回children
  if (configurableFlows.length === 0) {
    return <>{children}</>;
  }

  // 构建右键菜单项
  const menuItems: MenuProps['items'] = [
    {
      key: 'flows-header',
      type: 'group' as const,
      label: 'Flow配置',
      children: configurableFlows.map((flow) => ({
        key: flow.key,
        icon: <SettingOutlined />,
        label: flow.title || flow.key,
      })),
    },
  ];

  return (
    <>
      <Dropdown
        menu={{
          items: menuItems,
          onClick: handleMenuClick,
        }}
        trigger={['contextMenu']}
        placement={position === 'left' ? 'bottomLeft' : 'bottomRight'}
      >
        <div style={{ display: 'inline-block', width: '100%' }}>
          {children}
        </div>
      </Dropdown>
      
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
};

export default observer(FlowsContextMenu); 