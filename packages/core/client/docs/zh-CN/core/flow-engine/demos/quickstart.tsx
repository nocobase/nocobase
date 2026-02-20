import { Input } from '@formily/antd-v5';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer, IFlowModelRepository } from '@nocobase/flow-engine';
import React from 'react';

// 实现一个本地存储的模型仓库，负责模型的持久化
class FlowModelRepository implements IFlowModelRepository<FlowModel> {
  // 从本地存储加载模型数据
  async findOne({ uid }) {
    const data = localStorage.getItem(`flow-model:${uid}`);
    if (!data) return null;
    return JSON.parse(data);
  }

  // 将模型数据保存到本地存储
  async save(model: FlowModel) {
    localStorage.setItem(`flow-model:${model.uid}`, JSON.stringify(model.serialize()));
    console.log('Saving model:', model);
    return model;
  }

  // 从本地存储中删除模型数据
  async destroy(uid: string) {
    localStorage.removeItem(`flow-model:${uid}`);
    return true;
  }
}

// 自定义模型类，继承自 FlowModel
class MyModel extends FlowModel {
  // 渲染模型内容
  render() {
    return <div>{this.props.name}</div>;
  }
}

// 为 MyModel 配置流
MyModel.registerFlow({
  key: 'defaultFlow',
  title: 'Default Flow',
  steps: {
    step1: {
      uiSchema: {
        name: {
          type: 'string',
          title: 'Name',
          'x-component': Input,
        },
      },
      // 步骤处理函数，设置模型属性
      handler(ctx, params) {
        ctx.model.setProps('name', params.name);
      },
    },
  },
});

// 插件类，负责注册模型、仓库，并加载或创建模型实例
class PluginHelloModel extends Plugin {
  async load() {
    // 注册自定义模型
    this.flowEngine.registerModels({ MyModel });
    // 设置模型仓库（本地存储实现）
    this.flowEngine.setModelRepository(new FlowModelRepository());
    // 加载或创建模型实例（如不存在则创建并初始化）
    const model = await this.flowEngine.loadOrCreateModel({
      uid: 'my-model',
      use: 'MyModel',
      stepParams: {
        defaultFlow: {
          step1: {
            name: 'NocoBase',
          },
        },
      },
    });
    // 注册路由，渲染模型
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} showFlowSettings />,
    });
  }
}

// 创建应用实例，注册插件
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
