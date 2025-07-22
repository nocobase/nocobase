import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import MockAdapter from 'axios-mock-adapter';
import React from 'react';

class HelloBlockModel extends FlowModel {
  render() {
    return <pre ref={this.context.ref as any}></pre>;
  }
}

HelloBlockModel.registerFlow({
  key: 'ref-example',
  title: 'Ref Example',
  auto: true,
  steps: {
    refReady: {
      handler: async (ctx) => {
        ctx.onRefReady(ctx.ref, async (el) => {
          const response = await ctx.api.request({
            method: 'get',
            url: '/users:get',
          });
          el.innerHTML = JSON.stringify(response.data, null, 2);
        });
      },
    },
  },
});

class PluginHelloModel extends Plugin {
  async load() {
    const mock = new MockAdapter(this.app.apiClient.axios);

    mock.onGet('/users:get').reply(200, {
      data: { id: 1, name: 'John Smith' },
    });

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
