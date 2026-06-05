import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import React from 'react';

class HelloFlowModel extends FlowModel {
  render() {
    const { name } = this.props;
    return (
      <div
        onClick={(event) => {
          this.dispatchEvent('event1', { event });
        }}
      >
        Hello {name}
      </div>
    );
  }
}

HelloFlowModel.registerFlow({
  key: 'default',
  on: {
    eventName: 'event1',
  },
  steps: {
    step1: {
      async handler(ctx, params) {
        ctx.logger.info('Event triggered with ctx:', ctx);
        // alert(`Event triggered with params`);
      },
    },
  },
});

// 插件定义
class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.registerModels({ HelloFlowModel });
    const model = this.flowEngine.createModel({
      use: 'HelloFlowModel',
      props: {
        name: 'NocoBase',
      },
    });
    this.router.add('root', { path: '/', element: <FlowModelRenderer model={model} /> });
  }
}

// 创建应用实例
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
