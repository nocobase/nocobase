import { uid } from '@formily/shared';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import React from 'react';

class HelloModel extends FlowModel {
  onInit() {
    this.context.defineProperty('noCache', {
      get: () => uid(),
      cache: false, // 不缓存
    });
  }
  render() {
    return (
      <div>
        <h4>不带缓存的属性（noCache）</h4>
        <div>第一次读取: {this.context.noCache}</div>
        <div>第二次读取: {this.context.noCache}</div>
      </div>
    );
  }
}

class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ HelloModel });
    const model = this.flowEngine.createModel({ use: 'HelloModel' });
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
