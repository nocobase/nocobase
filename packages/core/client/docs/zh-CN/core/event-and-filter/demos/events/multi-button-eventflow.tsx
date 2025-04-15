import { Button, Space, Divider } from 'antd';
import React from 'react';
import { EventFlowManager, EventBus } from '@nocobase/client';
import { openSimpleDialogAction } from '../actions/open-simple-dialog';
import { openNotificationAction } from '../actions/open-notification';
import { openFormDialogAction } from '../actions/open-form-dialog';

// 创建事件总线和事件流管理器
const eventBus = new EventBus();
const eventFlowManager = new EventFlowManager(eventBus);

// Basic setup
eventFlowManager.addEventGroup({
  name: 'component',
  title: '组件事件',
  sort: 1,
});

// Register events for different buttons
eventFlowManager.addEvent({
  name: 'button1:click',
  title: '按钮1点击',
  description: '用户点击按钮1时触发',
  group: 'component',
  sort: 1,
  uiSchema: {},
});

eventFlowManager.addEvent({
  name: 'button2:click',
  title: '按钮2点击',
  description: '用户点击按钮2时触发',
  group: 'component',
  sort: 2,
  uiSchema: {},
});

eventFlowManager.addEvent({
  name: 'button3:click',
  title: '按钮3点击',
  description: '用户点击按钮3时触发',
  group: 'component',
  sort: 3,
  uiSchema: {},
});

// Register action group
eventFlowManager.addActionGroup({
  name: 'ui',
  title: 'UI操作',
  sort: 1,
});

// Register actions
eventFlowManager.addAction(openSimpleDialogAction);
eventFlowManager.addAction(openNotificationAction);
eventFlowManager.addAction(openFormDialogAction);

// Create flow for button 1
eventFlowManager.addFlow({
  key: 'button1-flow',
  title: '按钮1流程',
  on: {
    event: 'button1:click',
    title: '当按钮1被点击时',
  },
  steps: [
    {
      key: 'step1',
      title: '显示通知',
      action: 'openNotification',
      params: {
        title: '按钮1的通知',
        description: '您点击了按钮1',
        duration: 3,
      },
      isAwait: true,
    },
  ],
});

// Create flow for button 2
eventFlowManager.addFlow({
  key: 'button2-flow',
  title: '按钮2流程',
  on: {
    event: 'button2:click',
    title: '当按钮2被点击时',
  },
  steps: [
    {
      key: 'step1',
      title: '显示对话框',
      action: 'openSimpleDialog',
      params: {
        title: '按钮2的对话框',
        width: 500,
      },
      isAwait: true,
    },
  ],
});

// Create flow for button 3
eventFlowManager.addFlow({
  key: 'button3-flow',
  title: '按钮3流程',
  on: {
    event: 'button3:click',
    title: '当按钮3被点击时',
  },
  steps: [
    {
      key: 'step1',
      title: '打开表单对话框',
      action: 'openFormDialog',
      params: {
        title: '按钮3的表单',
        width: 500,
      },
      isAwait: true,
    },
  ],
});

const MultiButtonEventFlow = () => {
  const createClickHandler = (buttonNum) => {
    return () => {
      // 准备事件上下文
      const ctx = {
        payload: {
          button: buttonNum,
          time: new Date().toLocaleString(),
        },
      };

      // 触发原始事件名称
      eventBus.dispatchEvent(`button${buttonNum}:click`, ctx);
    };
  };

  return (
    <div style={{ padding: 24, background: '#f0f2f5', borderRadius: 8 }}>
      <h3>多按钮事件流演示</h3>
      <p>每个按钮触发不同的事件流</p>

      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space>
          <Button type="primary" onClick={createClickHandler(1)}>
            按钮1 (通知)
          </Button>

          <Button type="default" onClick={createClickHandler(2)}>
            按钮2 (对话框)
          </Button>

          <Button type="dashed" onClick={createClickHandler(3)}>
            按钮3 (表单)
          </Button>
        </Space>

        <Divider />

        <div style={{ background: '#fff', padding: 16, borderRadius: 4 }}>
          <p>每个按钮触发各自的事件流，展示不同的UI交互</p>
        </div>
      </Space>
    </div>
  );
};

export default MultiButtonEventFlow;
