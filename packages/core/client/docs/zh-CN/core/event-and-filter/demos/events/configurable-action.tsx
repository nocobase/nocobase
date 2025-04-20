import { Button, Space, Typography, message } from 'antd';
import React, { useState } from 'react';
import { EventFlowManager, EventBus } from '@nocobase/client';
import { configureAction } from '../actions/open-configure-dialog';

// 创建事件总线和事件流管理器
const eventBus = new EventBus();
// 传入 eventBus 实例到 EventFlowManager
const eventFlowManager = new EventFlowManager(eventBus);

// 注册事件组
eventFlowManager.addEventGroup({
  name: 'component',
  title: '组件事件',
  sort: 1,
});

// 注册事件
eventFlowManager.addEvent({
  name: 'button:click',
  title: '按钮点击',
  description: '用户点击按钮时触发',
  group: 'component',
  sort: 1,
  uiSchema: {},
});

eventFlowManager.addEvent({
  name: 'configure:click',
  title: '配置按钮点击',
  description: '用户点击配置按钮时触发',
  group: 'component',
  sort: 2,
  uiSchema: {},
});

// 注册动作组
eventFlowManager.addActionGroup({
  name: 'ui',
  title: 'UI操作',
  sort: 1,
});

// 注册消息提示动作
eventFlowManager.addAction({
  name: 'showMessage',
  title: '显示消息',
  description: '显示一条消息提示',
  group: 'ui',
  sort: 1,
  // 定义动作参数的UI配置模式
  uiSchema: {
    title: {
      type: 'string',
      title: '标题',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      default: '默认标题',
    },
    content: {
      type: 'string',
      title: '内容',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
      default: '默认消息内容',
    },
    type: {
      type: 'string',
      title: '类型',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        options: [
          { label: '成功', value: 'success' },
          { label: '错误', value: 'error' },
          { label: '警告', value: 'warning' },
          { label: '信息', value: 'info' },
        ],
      },
      default: 'info',
    },
  },
  handler: async (params, context) => {
    // 动作执行逻辑
    const { title, content, type } = params;
    message[type]({
      content: (
        <div>
          <div style={{ fontWeight: 'bold' }}>{title}</div>
          <div>{content}</div>
        </div>
      ),
      duration: 3,
    });

    return {
      success: true,
      data: params,
    };
  },
});

// 注册配置动作
eventFlowManager.addAction(configureAction);

// 创建消息显示事件流
eventFlowManager.addFlow({
  key: 'message-flow',
  title: '消息提示流程',
  on: {
    event: 'button:click',
    title: '当按钮被点击时',
  },
  steps: [
    {
      key: 'message-step',
      title: '显示消息提示',
      action: 'showMessage',
      isAwait: true,
    },
  ],
});

// 创建配置事件流
eventFlowManager.addFlow({
  key: 'configure-flow',
  title: '配置流程',
  on: {
    event: 'configure:click',
    title: '当配置按钮被点击时',
  },
  steps: [
    {
      key: 'configure-step',
      title: '配置消息参数',
      action: 'configureAction',
      isAwait: true,
    },
  ],
});

// 主演示组件
const ConfigurableActionDemo = () => {
  const [currentParams, setCurrentParams] = useState<Record<string, any>>({
    title: '消息标题',
    content: '这是一条测试消息',
    type: 'info',
  });

  // 打开配置弹窗
  const showConfig = () => {
    const step = eventFlowManager.getFlow('message-flow').getStep('message-step');
    const ctx = {
      payload: {
        step,
        onChange: (values) => {
          setCurrentParams(values);
        },
        currentParams,
      },
    };
    eventBus.dispatchEvent('configure:click', ctx);
  };

  // 触发消息动作
  const triggerAction = () => {
    const ctx = {
      payload: {},
      meta: {
        stepParams: {
          'message-step': currentParams,
        },
      },
    };
    eventBus.dispatchEvent('button:click', ctx);
  };

  return (
    <div style={{ padding: 24, background: '#f0f2f5', borderRadius: 8 }}>
      <Typography.Title level={4}>动作参数配置演示</Typography.Title>
      <Typography.Paragraph>
        点击&quot;配置参数&quot;按钮修改消息的标题、内容和类型，然后点击&quot;执行动作&quot;查看效果。
      </Typography.Paragraph>

      <div style={{ marginBottom: 16 }}>
        <Typography.Text strong>当前配置:</Typography.Text>
        <ul>
          <li>标题: {currentParams.title}</li>
          <li>内容: {currentParams.content}</li>
          <li>类型: {currentParams.type}</li>
        </ul>
      </div>

      <Space>
        <Button type="primary" onClick={showConfig}>
          配置参数
        </Button>

        <Button onClick={triggerAction}>执行动作</Button>
      </Space>
    </div>
  );
};

export default ConfigurableActionDemo;
