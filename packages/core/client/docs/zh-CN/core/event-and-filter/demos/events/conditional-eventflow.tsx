import { Button, Radio, Space } from 'antd';
import React, { useState } from 'react';
import { EventFlowManager, EventBus } from '@nocobase/client';
import { openSimpleDialogAction } from '../actions/open-simple-dialog';
import { openNotificationAction } from '../actions/open-notification';

const eventBus = new EventBus();
const eventFlowManager = new EventFlowManager(eventBus);

eventFlowManager.addEventGroup({
  name: 'component',
  title: '组件事件',
  sort: 1,
});

eventFlowManager.addEvent({
  name: 'button:click',
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

eventFlowManager.addAction(openSimpleDialogAction);
eventFlowManager.addAction(openNotificationAction);

eventFlowManager.addFlow({
  key: 'conditional-flow-demo',
  title: '条件流程演示',
  on: {
    event: 'button:click',
    title: '当按钮被点击时',
  },
  steps: [
    {
      key: 'step1',
      title: '根据条件执行不同操作',
      action: 'openSimpleDialog',
      // 根据用户选择的选项决定操作
      condition: '{{ctx.payload.option === "A"}}',
      params: {
        title: '选项A的对话框',
        width: 500,
      },
      isAwait: true,
    },
    {
      key: 'step2',
      title: '显示通知',
      action: 'openNotification',
      // 仅在用户选择选项B时执行
      condition: '{{ctx.payload.option === "B"}}',
      params: {
        title: '选项B的通知',
        description: '您选择了选项B',
        duration: 3,
      },
      isAwait: true,
    },
  ],
});

const ConditionalEventFlow = () => {
  const [selectedOption, setSelectedOption] = useState('A');

  const handleClick = () => {
    // 准备事件上下文，包含用户选择
    const ctx = {
      payload: {
        option: selectedOption,
      },
    };

    // 触发原始事件名称
    eventBus.dispatchEvent('button:click', ctx);
  };

  return (
    <div style={{ padding: 24, background: '#f0f2f5', borderRadius: 8 }}>
      <h3>条件事件流演示</h3>
      <p>根据选择的选项执行不同的动作</p>

      <Space direction="vertical" size="middle">
        <Radio.Group value={selectedOption} onChange={(e) => setSelectedOption(e.target.value)}>
          <Radio value="A">选项A (显示对话框)</Radio>
          <Radio value="B">选项B (显示通知)</Radio>
        </Radio.Group>

        <Button type="primary" onClick={handleClick}>
          触发条件事件流
        </Button>
      </Space>
    </div>
  );
};

export default ConditionalEventFlow;
