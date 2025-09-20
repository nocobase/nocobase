import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Space, message } from 'antd';
import React from 'react';

// 模型类
class MyModel extends FlowModel {
  render() {
    const eventCount = this.props.eventCount || 0;

    return (
      <Space>
        <Button type="primary" onClick={() => this.dispatchEvent('testEvent')}>
          触发事件
        </Button>
        <div>事件触发次数: {eventCount}</div>
        <div>已注册事件: {this.getEvents().size}</div>
      </Space>
    );
  }
}

// 插件类
class PluginEventRegistryDemo extends Plugin {
  async load() {
    // 注册全局 Events
    this.flowEngine.registerEvents({
      testEvent: {
        name: 'testEvent',
        title: '测试事件',
        description: '用于演示事件注册的测试事件',
      },
      logEvent: {
        name: 'logEvent',
        title: '日志事件',
        label: '记录日志',
        description: '触发时会记录日志的事件',
      },
    });

    this.flowEngine.registerModels({ MyModel });

    // 创建模型实例
    const model = this.flowEngine.createModel({
      uid: 'my-model',
      use: 'MyModel',
    });

    // 注册流来监听事件
    model.registerFlow('eventHandlerFlow', {
      title: '事件处理流',
      on: 'testEvent', // 监听 testEvent 事件
      steps: {
        step1: {
          title: '更新计数',
          handler(ctx) {
            const current = ctx.model.props.eventCount || 0;
            ctx.model.setProps('eventCount', current + 1);
            message.success(`事件已触发 ${current + 1} 次`);

            // 触发另一个事件
            ctx.model.dispatchEvent('logEvent');
          },
        },
      },
    });

    // 注册另一个流来监听日志事件
    model.registerFlow('logHandlerFlow', {
      title: '日志处理流',
      on: 'logEvent', // 监听 logEvent 事件
      steps: {
        step1: {
          title: '记录日志',
          handler(ctx) {
            console.log('日志事件被触发');
            message.info('查看控制台输出');
          },
        },
      },
    });

    this.router.add('root', {
      path: '/',
      element: (
        <div style={{ padding: 20 }}>
          <Space direction="vertical">
            <div>基础 Event 示例：展示全局事件的注册和触发</div>
            <div>点击按钮触发事件，查看事件处理效果</div>
            <FlowModelRenderer model={model} />
          </Space>
        </div>
      ),
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginEventRegistryDemo],
});

export default app.getRootComponent();
