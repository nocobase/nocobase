import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import React from 'react';

class HelloBlockModel extends FlowModel {
  text: string;
  render() {
    return (
      <div>
        <h1>{this.text}</h1>
      </div>
    );
  }
}

HelloBlockModel.registerFlow({
  key: 'default',
  auto: true,
  steps: {
    step1: {
      handler: async (ctx) => {
        ctx.model.text = 'Hello, NocoBase!';
      },
    },
  },
});

class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ HelloBlockModel });
    const model = this.flowEngine.createModel({
      uid: 'my-model',
      use: 'HelloBlockModel',
    });
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

// 创建应用实例，注册插件
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
