import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button } from 'antd';
import React from 'react';

class HelloBlockModel extends FlowModel {
  render() {
    return (
      <Button
        type="primary"
        onClick={() => {
          this.dispatchEvent('click');
        }}
      >
        Open
      </Button>
    );
  }
}

HelloBlockModel.registerFlow({
  key: 'click',
  on: 'click',
  steps: {
    refReady: {
      handler: async (ctx) => {
        await ctx.viewOpener.open({
          mode: 'dialog',
          title: 'Hello World',
          // width: 1200,
          content: () => 'This is a view opened from the flow context.',
          // footer: 'OK',
          closable: true,
        });
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
