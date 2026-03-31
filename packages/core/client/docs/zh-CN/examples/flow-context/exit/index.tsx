import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Space } from 'antd';
import React from 'react';

class HelloBlockModel extends FlowModel {
  render() {
    return (
      <Button
        onClick={async () => {
          this.dispatchEvent('click');
        }}
      >
        Delete
      </Button>
    );
  }
}

HelloBlockModel.registerFlow({
  key: 'click',
  on: 'click',
  steps: {
    confirm: {
      handler: async (ctx) => {
        const r = await ctx.modal.confirm({
          title: 'Confirm',
          content: '确定要删除吗？',
        });
        if (!r) {
          ctx.message.info({
            content: '已取消删除',
          });
          ctx.exit();
        }
      },
    },
    delete: {
      handler: async (ctx) => {
        ctx.message.success({
          content: '删除成功',
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

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
