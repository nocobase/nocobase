import { uid } from '@formily/shared';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Card } from 'antd';
import React from 'react';

class AsyncValueModel extends FlowModel {
  asyncValue: any;
  onInit() {
    this.context.defineProperty('asyncValue', {
      get: async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return `异步结果-${uid()}`;
      },
    });
  }
  async onBeforeAutoFlows() {
    this.asyncValue = await this.context.asyncValue;
    console.log('Async value prepared:', this.asyncValue);
  }
  render() {
    return (
      <Card title="异步属性 asyncValue 示例" style={{ width: 400 }}>
        <div style={{ marginTop: 8 }}>
          <div>asyncValue: {this.asyncValue}</div>
        </div>
      </Card>
    );
  }
}

AsyncValueModel.registerFlow({
  key: 'examples',
  steps: {},
});

class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ AsyncValueModel });
    const model = this.flowEngine.createModel({
      use: 'AsyncValueModel',
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
