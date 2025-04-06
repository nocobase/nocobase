import { Button } from 'antd';
import React from 'react';
import { EventFlowManager } from '../libs/eventflow-manager';
import { openSimpleDialogAction } from '../actions/open-simple-dialog';
import { openNotificationAction } from '../actions/open-notification';
import { EventBus } from '../libs/event-bus';

// Create managers
const eventBus = new EventBus();
const eventFlowManager = new EventFlowManager();

// Basic setup
eventFlowManager.addEventGroup({
  name: 'component',
  title: '组件事件',
  sort: 1,
});

eventFlowManager.addEvent({
  name: 'eventflow:button:click',
  title: '按钮点击',
  description: '用户点击按钮时触发',
  group: 'component',
  sort: 1,
  uiSchema: {},
});

eventFlowManager.addActionGroup({
  name: 'ui',
  title: 'UI操作',
  sort: 1,
});

eventFlowManager.addActionGroup({
  name: 'data',
  title: '数据操作',
  sort: 2,
});

eventFlowManager.addAction(openSimpleDialogAction);
eventFlowManager.addAction(openNotificationAction);

// Add a custom data processing action
eventFlowManager.addAction({
  name: 'processData',
  title: '处理数据',
  description: '处理上下文中的数据并添加新信息',
  group: 'data',
  sort: 201,
  uiSchema: {
    prefix: {
      type: 'string',
      title: '前缀',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      default: '处理结果：',
    },
  },
  handler: async (params, context) => {
    const { prefix = '处理结果：' } = params;

    // 添加处理结果到上下文
    context.results.processedData = `${prefix}${context.payload.initialData || ''}`;
    context.results.processedTime = new Date().toLocaleString();

    return context;
  },
});

// Create flow with data passing between steps
eventFlowManager.addFlow({
  key: 'data-passing-flow',
  title: '数据传递演示流程',
  on: {
    event: 'eventflow:button:click',
    title: '当按钮被点击时',
  },
  steps: [
    {
      key: 'step1',
      title: '处理数据',
      action: 'processData',
      params: {
        prefix: '已处理: ',
      },
      isAwait: true,
    },
    {
      key: 'step2',
      title: '显示处理结果',
      action: 'openNotification',
      params: {
        title: '数据处理结果',
        duration: 5,
      },
      isAwait: true,
    },
  ],
});

eventBus.on('button:click', (ctx) => {
  eventFlowManager.dispatchEvent('eventflow:button:click', ctx);
});

const DataPassingEventFlow = () => {
  const handleClick = () => {
    // 准备事件上下文
    const ctx = {
      payload: {
        initialData: '用户输入的原始数据',
        time: new Date().toLocaleString(),
      },
    };

    // 触发事件
    eventBus.dispatchEvent('button:click', ctx);
  };

  return (
    <div style={{ padding: 24, background: '#f0f2f5', borderRadius: 8 }}>
      <h3>数据传递演示</h3>
      <p>演示事件流中各步骤之间的数据传递</p>
      <Button type="primary" onClick={handleClick}>
        触发数据处理流程
      </Button>
    </div>
  );
};

export default DataPassingEventFlow;
