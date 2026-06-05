import { uid } from '@formily/shared';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Card, Space } from 'antd';
import React from 'react';

class SyncValueModel extends FlowModel {
  onInit() {
    this.context.defineProperty('syncValue', {
      get() {
        return `同步结果-${uid()}`;
      },
    });
  }
  render() {
    return (
      <Card title="同步属性 syncValue 示例" style={{ width: 400 }}>
        <div style={{ marginTop: 8 }}>
          <div>syncValue: {this.context.syncValue}</div>
        </div>
      </Card>
    );
  }
}

class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ SyncValueModel });
    const model = this.flowEngine.createModel({
      use: 'SyncValueModel',
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
