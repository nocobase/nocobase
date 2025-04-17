import { Button, InputNumber, Space, Switch, Typography } from 'antd';
import React, { useState } from 'react';
import { EventFlowManager, EventBus } from '@nocobase/client';
import { openSimpleDialogAction } from '../actions/open-simple-dialog';
import { openNotificationAction } from '../actions/open-notification';

const { Text } = Typography;

// Event and flow managers
const eventBus = new EventBus();
const eventFlowManager = new EventFlowManager(eventBus);

// Register event groups and events
eventFlowManager.addEventGroup({
  name: 'component',
  title: '组件事件',
  sort: 1,
});

eventFlowManager.addEvent({
  name: 'button:click',
  title: '阈值检查',
  description: '检查数值是否超过阈值',
  group: 'component',
  sort: 1,
  uiSchema: {},
});

// Register action groups and actions
eventFlowManager.addActionGroup({
  name: 'ui',
  title: 'UI操作',
  sort: 1,
});

eventFlowManager.addAction(openSimpleDialogAction);
eventFlowManager.addAction(openNotificationAction);

// Create event flow with a condition at the event level
eventFlowManager.addFlow({
  key: 'conditional-trigger-flow',
  title: '条件触发流程演示',
  on: {
    event: 'button:click',
    title: '当数值超过阈值时',
    // 添加事件级别的条件：仅在启用监控且值超过阈值时触发
    condition: '{{ctx.payload.monitoringEnabled && ctx.payload.currentValue > ctx.payload.threshold}}',
  },
  steps: [
    {
      key: 'step1',
      title: '显示警告对话框',
      action: 'openSimpleDialog',
      isAwait: true,
    },
    {
      key: 'step2',
      title: '发送通知',
      action: 'openNotification',
      isAwait: true,
    },
  ],
});

const ConditionalFlowTrigger = () => {
  const [threshold, setThreshold] = useState(50);
  const [currentValue, setCurrentValue] = useState(30);
  const [monitoringEnabled, setMonitoringEnabled] = useState(true);

  const handleCheck = () => {
    // 准备事件上下文
    const ctx = {
      payload: {
        threshold,
        currentValue,
        monitoringEnabled,
        time: new Date().toLocaleString(),
      },
      meta: {
        actionParams: [
          {
            flow: 'conditional-trigger-flow',
            params: {
              step1: {
                title: '阈值警告',
                width: 500,
              },
              step2: {
                title: '阈值超限警告',
                duration: 5,
              },
            },
          },
        ],
      },
    };

    // 触发原始事件名称
    eventBus.dispatchEvent('button:click', ctx);
  };

  return (
    <div style={{ padding: 24, background: '#f0f2f5', borderRadius: 8 }}>
      <h3>条件触发事件流演示</h3>
      <p>仅当启用监控并且当前值超过阈值时，才会触发事件流</p>

      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space>
          <Text>阈值设置:</Text>
          <InputNumber value={threshold} onChange={(value) => setThreshold(value)} min={0} max={100} />
        </Space>

        <Space>
          <Text>当前值:</Text>
          <InputNumber value={currentValue} onChange={(value) => setCurrentValue(value)} min={0} max={100} />
          <Text type={currentValue > threshold ? 'danger' : 'success'}>
            {currentValue > threshold ? '超过阈值' : '正常范围'}
          </Text>
        </Space>

        <Space>
          <Text>启用监控:</Text>
          <Switch checked={monitoringEnabled} onChange={(checked) => setMonitoringEnabled(checked)} />
        </Space>

        <Button type="primary" onClick={handleCheck}>
          检查阈值
        </Button>

        <div style={{ background: '#fff', padding: 16, borderRadius: 4, marginTop: 16 }}>
          <p>
            事件流触发条件: <code>monitoringEnabled && currentValue &gt; threshold</code>
          </p>
          <p>
            当前状态:{' '}
            {monitoringEnabled && currentValue > threshold ? (
              <Text type="danger">将触发事件流</Text>
            ) : (
              <Text type="secondary">不会触发事件流</Text>
            )}
          </p>
        </div>
      </Space>
    </div>
  );
};

export default ConditionalFlowTrigger;
