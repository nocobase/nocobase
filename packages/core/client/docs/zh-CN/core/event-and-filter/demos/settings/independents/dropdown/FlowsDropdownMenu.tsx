import React from 'react';
import { Menu, Card, Space, Typography, Divider } from 'antd';
import { PlayCircleOutlined, SettingOutlined, EyeOutlined } from '@ant-design/icons';
import { FlowModel } from '@nocobase/client';

const { Text } = Typography;

interface FlowsDropdownMenuProps {
  model: FlowModel;
  onClose?: () => void;
}

/**
 * 下拉菜单的内容组件
 * 显示可用的流程配置选项
 */
export const FlowsDropdownMenu: React.FC<FlowsDropdownMenuProps> = ({
  model,
  onClose,
}) => {
  // 获取所有可用的流程
  const ModelClass = model.constructor as typeof FlowModel;
  const allFlows = ModelClass.getFlows();
  const availableFlows = Array.from(allFlows.keys());
  
  // 获取默认流程作为已应用的流程
  const defaultFlows = model.getDefaultFlows();
  const appliedFlows = defaultFlows.map(flow => flow.key);

  const handleFlowToggle = async (flowKey: string) => {
    try {
      if (appliedFlows.includes(flowKey)) {
        // 对于默认流程，这里可以添加移除逻辑
        console.log('移除流程:', flowKey);
      } else {
        await model.applyFlow(flowKey);
      }
      onClose?.();
    } catch (error) {
      console.error('切换流程时出错:', error);
    }
  };

  const handleFlowConfigure = (flowKey: string) => {
    // 这里可以打开配置弹窗或跳转到配置页面
    console.log('配置流程:', flowKey);
    onClose?.();
  };

  const menuItems = availableFlows.map(flowKey => {
    const isApplied = appliedFlows.includes(flowKey);
    const flow = allFlows.get(flowKey);
    
    return {
      key: flowKey,
      label: (
        <div style={{ minWidth: 200 }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Text strong>{flow?.title || flowKey}</Text>
              <Space size="small">
                <SettingOutlined 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFlowConfigure(flowKey);
                  }}
                  style={{ cursor: 'pointer', color: '#1890ff' }}
                  title="配置"
                />
              </Space>
            </div>
            {flow && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {flow.title ? `Key: ${flowKey}` : '暂无描述'}
              </Text>
            )}
          </Space>
        </div>
      ),
      onClick: () => handleFlowToggle(flowKey),
    };
  });

  if (availableFlows.length === 0) {
    return (
      <Card size="small" style={{ minWidth: 200 }}>
        <Text type="secondary">暂无可用的流程配置</Text>
      </Card>
    );
  }

  return (
    <Card size="small" style={{ padding: 0 }}>
      <Menu
        items={menuItems}
        style={{ border: 'none' }}
        mode="vertical"
      />
    </Card>
  );
}; 