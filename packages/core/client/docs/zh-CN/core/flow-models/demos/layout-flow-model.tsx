/**
 * iframe: true
 * compact: true
 */
import ProLayout from '@ant-design/pro-layout';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import React from 'react';

class LayoutFlowModel extends FlowModel {
  render() {
    const { name } = this.props;
    return (
      <div>
        <ProLayout />
      </div>
    );
  }
}

// 插件定义
class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.registerModels({ LayoutFlowModel });
    const model = this.flowEngine.createModel({
      use: 'LayoutFlowModel',
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
