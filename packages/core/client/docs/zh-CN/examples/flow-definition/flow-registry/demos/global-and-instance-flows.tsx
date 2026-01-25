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
        <Button type="primary" onClick={() => this.dispatchEvent('click')}>
          {this.constructor.name}
        </Button>
        <div>点击: {count}</div>
        <div>流数量: {this.getFlows().size}</div>
      </Space>
    );
  }
}

class MyModel1 extends MyModel {}
class MyModel2 extends MyModel {}

// 注册全局流
MyModel.registerFlow('globalInit', {
  title: '全局初始化',
  steps: {
    init: {
      use: 'initAction',
    },
  },
});

// 插件类
class PluginFlowRegistryDemo extends Plugin {
  async load() {
    // 注册 Actions
    this.flowEngine.registerActions({
      initAction: {
        title: 'Init Action',
        name: 'initAction',
        handler(ctx) {
          ctx.model.setProps('count', 0);
        },
      },
      incrementAction: {
        title: 'Increment Action',
        name: 'incrementAction',
        handler(ctx) {
          const current = ctx.model.props.count || 0;
          ctx.model.setProps('count', current + 1);
          message.success(`+1，当前: ${current + 1}`);
        },
      },
      doubleAction: {
        title: 'Double Action',
        name: 'doubleAction',
        handler(ctx) {
          const current = ctx.model.props.count || 0;
          ctx.model.setProps('count', current + 2);
          message.info(`+2，当前: ${current + 2}`);
        },
      },
    });

    this.flowEngine.registerModels({ MyModel, MyModel1, MyModel2 });

    // Model1 - 点击 +1
    const model1 = this.flowEngine.createModel({
      uid: 'model1',
      use: 'MyModel1',
    });

    model1.registerFlow('clickFlow', {
      title: '点击流',
      on: 'click',
      steps: {
        increment: { use: 'incrementAction' },
      },
    });

    // model2 - 点击 +2
    const model2 = this.flowEngine.createModel({
      uid: 'model2',
      use: 'MyModel2',
    });

    model2.registerFlow('clickFlow', {
      title: '点击流',
      on: 'click',
      steps: {
        double: { use: 'doubleAction' },
      },
    });

    this.router.add('root', {
      path: '/',
      element: (
        <div style={{ padding: 20 }}>
          <Space direction="vertical">
            <div>全局流：所有模型共享初始化流程</div>
            <div>实例流：不同模型有不同的点击行为</div>
            <Space>
              <FlowModelRenderer model={model1} />
              <FlowModelRenderer model={model2} />
            </Space>
          </Space>
        </div>
      ),
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginFlowRegistryDemo],
});

export default app.getRootComponent();
