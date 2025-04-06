import { Button } from 'antd';
import React from 'react';
import { EventFlowManager } from '../libs/eventflow-manager';
import { openSimpleDialogAction } from '../actions/open-simple-dialog';
import { openNotificationAction } from '../actions/open-notification';
import { openFormDialogAction } from '../actions/open-form-dialog';
import { EventBus } from '../libs/event-bus';

// 创建事件总线实例
const eventBus = new EventBus();

// 创建事件流管理器实例
const eventFlowManager = new EventFlowManager();

// 注册事件组
eventFlowManager.addEventGroup({
  name: 'component',
  title: '组件事件',
  sort: 1,
});

// 注册按钮点击事件
eventFlowManager.addEvent({
  name: 'eventflow:button:click',
  title: '按钮点击',
  description: '用户点击按钮时触发',
  group: 'component',
  sort: 1,
  uiSchema: {},
});

// 注册动作组
eventFlowManager.addActionGroup({
  name: 'ui',
  title: 'UI操作',
  sort: 1,
});

// 注册三个动作
eventFlowManager.addAction(openSimpleDialogAction);
eventFlowManager.addAction(openNotificationAction);
eventFlowManager.addAction(openFormDialogAction);

// 创建事件流：按钮点击后依次执行三个动作
eventFlowManager.addFlow({
  key: 'demo-button-click-flow',
  title: '按钮点击演示流程',
  on: {
    event: 'eventflow:button:click',
    title: '当按钮被点击时',
  },
  steps: [
    {
      key: 'step1',
      title: '打开简单对话框',
      action: 'openSimpleDialog',
      params: {
        title: '第一步：简单对话框',
        width: 600,
      },
      isAwait: true, // 等待对话框关闭后再继续
    },
    {
      key: 'step2',
      title: '显示通知',
      action: 'openNotification',
      params: {
        title: '第二步：通知',
        description: '这是事件流的第二步，显示通知消息',
        duration: 3,
      },
      isAwait: true, // 等待通知操作完成后再继续
    },
    {
      key: 'step3',
      title: '打开表单对话框',
      action: 'openFormDialog',
      params: {
        title: '第三步：表单对话框',
        width: 500,
      },
      isAwait: true, // 等待表单对话框关闭后再继续
    },
  ],
});

eventBus.on('button:click', (ctx) => {
  // eventFlowManager的内部事件
  eventFlowManager.dispatchEvent('eventflow:button:click', ctx);
});

const BasicEventFlow = () => {
  const handleClick = () => {
    // 准备事件上下文
    const ctx = {
      payload: {
        name: 'eventflow-demo',
        time: new Date().toLocaleString(),
      },
    };

    // 触发事件
    eventBus.dispatchEvent('button:click', ctx);
  };

  return (
    <div style={{ padding: 24, background: '#f0f2f5', borderRadius: 8 }}>
      <h3>事件流演示</h3>
      <p>点击按钮将依次触发三个动作：简单对话框 → 通知 → 表单对话框</p>
      <Button type="primary" onClick={handleClick}>
        点击触发事件流
      </Button>
    </div>
  );
};

export default BasicEventFlow;
