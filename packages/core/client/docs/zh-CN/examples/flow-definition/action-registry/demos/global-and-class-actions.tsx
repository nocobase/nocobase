import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Space, message } from 'antd';
import React from 'react';

// 基础模型类
class BaseModel extends FlowModel {
  render() {
    const count = this.props.count || 0;

    return (
      <Space>
        <Button type="primary" onClick={() => this.applyFlow('testFlow')}>
          {this.constructor.name}
        </Button>
        <div>计数: {count}</div>
        <div>Actions: {this.getActions().size}</div>
      </Space>
    );
  }
}

class Model1 extends BaseModel {}
class Model2 extends BaseModel {}

// 注册类级别 Actions
BaseModel.registerActions({
  baseAction: {
    name: 'baseAction',
    title: '基类动作',
    handler(ctx) {
      const current = ctx.model.props.count || 0;
      ctx.model.setProps('count', current + 10);
      message.success(`基类动作: +10，当前: ${current + 10}`);
    },
  },
});

Model1.registerActions({
  model1Action: {
    name: 'model1Action',
    title: 'Model1专用动作',
    handler(ctx) {
      const current = ctx.model.props.count || 0;
      ctx.model.setProps('count', current + 1);
      message.info(`Model1动作: +1，当前: ${current + 1}`);
    },
  },
  // 覆盖基类的 action
  baseAction: {
    name: 'baseAction',
    title: 'Model1覆盖的基类动作',
    handler(ctx) {
      const current = ctx.model.props.count || 0;
      ctx.model.setProps('count', current + 100);
      message.warning(`Model1覆盖: +100，当前: ${current + 100}`);
    },
  },
});

Model2.registerActions({
  model2Action: {
    name: 'model2Action',
    title: 'Model2专用动作',
    handler(ctx) {
      const current = ctx.model.props.count || 0;
      ctx.model.setProps('count', current + 2);
      message.info(`Model2动作: +2，当前: ${current + 2}`);
    },
  },
});

// 插件类
class PluginActionRegistryDemo extends Plugin {
  async load() {
    // 注册全局 Actions
    this.flowEngine.registerActions({
      globalAction: {
        name: 'globalAction',
        title: '全局动作',
        handler(ctx) {
          const current = ctx.model.props.count || 0;
          ctx.model.setProps('count', current + 5);
          message.success(`全局动作: +5，当前: ${current + 5}`);
        },
      },
      resetAction: {
        name: 'resetAction',
        title: '重置动作',
        handler(ctx) {
          ctx.model.setProps('count', 0);
          message.info('计数已重置');
        },
      },
    });

    this.flowEngine.registerModels({ BaseModel, Model1, Model2 });

    // Model1 实例
    const model1 = this.flowEngine.createModel({
      uid: 'model1',
      use: 'Model1',
    });

    model1.registerFlow('testFlow', {
      title: '测试流',
      steps: {
        step1: { use: 'globalAction' }, // 全局 action
        step2: { use: 'baseAction' }, // 被覆盖的基类 action
        step3: { use: 'model1Action' }, // Model1 专用 action
      },
    });

    // Model2 实例
    const model2 = this.flowEngine.createModel({
      uid: 'model2',
      use: 'Model2',
    });

    model2.registerFlow('testFlow', {
      title: '测试流',
      steps: {
        step1: { use: 'globalAction' }, // 全局 action
        step2: { use: 'baseAction' }, // 继承的基类 action
        step3: { use: 'model2Action' }, // Model2 专用 action
        step4: { use: 'resetAction' }, // 全局 action
      },
    });

    this.router.add('root', {
      path: '/',
      element: (
        <div style={{ padding: 20 }}>
          <Space direction="vertical">
            <div>Action 优先级示例：类级别 &gt; 全局</div>
            <div>Model1 覆盖了基类 action，Model2 继承基类 action</div>
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
  plugins: [PluginActionRegistryDemo],
});

export default app.getRootComponent();
