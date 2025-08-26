import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Space, message } from 'antd';
import React from 'react';

// 模型类
class MyModel extends FlowModel {
  render() {
    const count = this.props.count || 0;

    return (
      <Space>
        <Button type="primary" onClick={() => this.applyFlow('testFlow')}>
          执行流
        </Button>
        <div>计数: {count}</div>
        <div>Actions: {this.getActions().size}</div>
      </Space>
    );
  }
}

// 插件类
class PluginActionRegistryDemo extends Plugin {
  async load() {
    // 注册全局 Actions
    this.flowEngine.registerActions({
      incrementAction: {
        name: 'incrementAction',
        title: '递增动作',
        handler(ctx) {
          const current = ctx.model.props.count || 0;
          ctx.model.setProps('count', current + 1);
          message.success(`计数已递增: ${current + 1}`);
        },
      },
      logAction: {
        name: 'logAction',
        title: '日志动作',
        handler(ctx) {
          console.log('Action executed!');
          message.info('查看控制台输出');
        },
      },
    });

    this.flowEngine.registerModels({ MyModel });

    // 创建模型实例
    const model = this.flowEngine.createModel({
      uid: 'my-model',
      use: 'MyModel',
    });

    // 注册流，使用全局 actions
    model.registerFlow('testFlow', {
      title: '测试流',
      steps: {
        step1: {
          title: '步骤1: 递增',
          use: 'incrementAction', // 使用全局 action
        },
        step2: {
          title: '步骤2: 日志',
          use: 'logAction', // 使用全局 action
        },
      },
    });

    this.router.add('root', {
      path: '/',
      element: (
        <div style={{ padding: 20 }}>
          <Space direction="vertical">
            <div>基础 Action 示例：流使用全局注册的 actions</div>
            <div>点击按钮执行包含两个步骤的流程</div>
            <FlowModelRenderer model={model} />
          </Space>
        </div>
      ),
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginActionRegistryDemo],
});

export default app.getRootComponent();
