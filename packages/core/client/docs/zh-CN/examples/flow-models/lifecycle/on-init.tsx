import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import React from 'react';

class HelloModel extends FlowModel {
  onInit(options: any): void {
    console.log('onInit');
  }

  protected onMount(): void {
    console.log('onMount');
  }

  protected onUnmount(): void {
    console.log('onUnmount');
  }

  async onBeforeAutoFlows() {
    console.log('onBeforeAutoFlows');
  }

  async onAfterAutoFlows() {
    console.log('onAfterAutoFlows');
  }

  render() {
    console.log('render');
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloModel.</p>
      </div>
    );
  }
}

HelloModel.registerFlow({
  key: 'a',
  steps: {},
});

class PluginHelloModel extends Plugin {
  async load() {
    // 注册 HelloModel 到 flowEngine
    this.flowEngine.registerModels({ HelloModel });

    // 创建 HelloModel 的实例（仅用于示例）
    const model = this.flowEngine.createModel({
      use: 'HelloModel',
    });

    // 添加路由，将模型渲染到根路径（仅用于示例）
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

// 创建应用实例，注册插件（仅用于示例）
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
