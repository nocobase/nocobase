import { Input } from '@formily/antd-v5';
import { Application, Plugin } from '@nocobase/client';
import { FlowEngine, FlowModel, FlowModelRenderer, IFlowModelRepository } from '@nocobase/flow-engine';
import React from 'react';

class FlowModelRepository implements IFlowModelRepository<FlowModel> {
  async load(uid: string) {
    const data = localStorage.getItem(`flow-model:${uid}`);
    if (!data) return null;
    // 假设 FlowModel 有 fromJSON 方法
    return JSON.parse(data);
  }

  async save(model: FlowModel) {
    // 假设 model 有 toJSON 方法
    localStorage.setItem(`flow-model:${model.uid}`, JSON.stringify(model.serialize()));
    console.log('Saving model:', model);
    return model;
  }

  async destroy(uid: string) {
    localStorage.removeItem(`flow-model:${uid}`);
    return true;
  }
}

class MyModel extends FlowModel {
  render() {
    return <div>{this.props.name}</div>;
  }
}

class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.registerModels({ MyModel });
    this.flowEngine.setModelRepository(new FlowModelRepository());
    let model = await this.flowEngine.loadModel('my-model');
    if (!model) {
      model = this.flowEngine.createModel({
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
      await model.save();
    }
    MyModel.registerFlow('defaultFlow', {
      auto: true,
      steps: {
        step1: {
          uiSchema: {
            name: {
              type: 'string',
              title: 'Name',
              'x-component': Input,
            },
          },
          handler(ctx, model: MyModel, params) {
            model.setProps('name', params.name);
          },
        },
      },
    });
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} showFlowSettings />,
    });
  }
}

// 创建应用实例
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
