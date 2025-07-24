import { Application, BlockModel, GridModel, Plugin } from '@nocobase/client';
import { FlowModelRenderer } from '@nocobase/flow-engine';
import { row } from 'mathjs';
import React from 'react';

class DemoBlockModel extends BlockModel {
  render() {
    return (
      <div style={{ padding: 8, border: '1px solid #ddd', borderRadius: 4, backgroundColor: '#f9f9f9' }}>
        <h3>Demo Block - #{this.uid}</h3>
        <p>This is a demo block content.</p>
      </div>
    );
  }
}

// 插件定义
class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.flowSettings.enable();
    this.flowEngine.registerModels({ GridModel, DemoBlockModel });
    const model = this.flowEngine.createModel({
      use: 'GridModel',
      stepParams: {},
      subModels: {
        items: [
          {
            use: 'DemoBlockModel',
            uid: 'block1',
          },
          {
            use: 'DemoBlockModel',
            uid: 'block2',
          },
          {
            use: 'DemoBlockModel',
            uid: 'block3',
          },
        ],
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
