/**
 * defaultShowCode: true
 */

import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import React, { createRef } from 'react';

class HelloBlockModel extends FlowModel {
  render() {
    return <div ref={this.context.ref}></div>;
  }
  protected onMount() {
    if (this.context.ref.current) {
      this.rerender();
    }
  }
}

HelloBlockModel.registerFlow({
  key: 'ref-example',
  title: 'Ref Example',
  auto: true,
  steps: {
    refReady: {
      handler: async (ctx) => {
        ctx.onRefReady(ctx.ref, (el) => {
          el.innerHTML = '<h3>Hello, NocoBase!</h3>';
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
    const fork1 = model.createFork({}, 'fork1');
    const fork2 = model.createFork({}, 'fork2');
    // 注册路由，渲染模型
    this.router.add('root', {
      path: '/',
      element: (
        <div>
          <h2>Fork1</h2>
          <FlowModelRenderer model={fork1} />
          <h2>Fork2</h2>
          <FlowModelRenderer model={fork2} />
        </div>
      ),
    });
  }
}

// 创建应用实例，注册插件
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
