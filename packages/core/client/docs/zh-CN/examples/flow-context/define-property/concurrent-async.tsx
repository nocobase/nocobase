import { observable } from '@formily/reactive';
import { uid } from '@formily/shared';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Card, Space } from 'antd';
import React from 'react';

class AsyncValueModel extends FlowModel {
  concurrent: any;
  callCount = observable.ref(0);
  onInit() {
    this.context.defineProperty('concurrent', {
      get: async () => {
        this.callCount.value++;
        await new Promise((resolve) => setTimeout(resolve, 500));
        return `异步结果-${uid()}`;
      },
    });
  }
  async onBeforeAutoFlows() {
    await Promise.all([this.context.concurrent, this.context.concurrent, this.context.concurrent]);
    this.concurrent = await this.context.concurrent;
  }
  render() {
    return (
      <Card title="异步属性 concurrent 示例" style={{ width: 400 }}>
        <div style={{ marginTop: 8 }}>
          <div>concurrent: {this.concurrent}</div>
          <div>调用次数: {this.callCount.value}</div>
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
