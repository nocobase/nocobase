import { Input } from '@formily/antd-v5';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer, FlowsSettings } from '@nocobase/flow-engine';
import { Card } from 'antd';
import React from 'react';

class HelloFlowModel extends FlowModel {
  render() {
    const { name } = this.props;
    return <Card>Hello {name}</Card>;
  }
}

HelloFlowModel.registerFlow('defaultFlow', {
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
      defaultParams: {
        name: 'NocoBase',
      },
      handler(ctx, params) {
        console.log('HelloFlowModel step1 handler', params);
        ctx.model.setProps('name', params.name);
      },
    },
  },
});

class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.registerModels({ HelloFlowModel });
    const model = this.flowEngine.createModel({
      use: 'HelloFlowModel',
      stepParams: {
        defaultFlow: {
          step1: {
            name: 'NocoBase',
          },
        },
      },
    });
    this.router.add('root', {
      path: '/',
      element: (
        <div>
          <FlowModelRenderer model={model} />
          <br />
          <FlowsSettings model={model} />
        </div>
      ),
    });
  }
}

// 创建应用实例
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
