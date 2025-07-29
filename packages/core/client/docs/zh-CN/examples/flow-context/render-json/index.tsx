/**
 * defaultShowCode: true
 */

import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer, resolveDefaultParams } from '@nocobase/flow-engine';
import React from 'react';

class HelloBlockModel extends FlowModel {
  render() {
    return <div ref={this.context.ref}></div>;
  }
  protected onMount() {
    if (this.context.ref.current) {
      console.log('HelloBlockModel mounted with ref:', this.context.ref.current);
      this.rerender();
    }
  }
}

HelloBlockModel.registerFlow({
  key: 'ref-example',
  title: 'Ref Example',
  steps: {
    refReady: {
      handler: async (ctx) => {
        ctx.defineProperty('bar', {
          get: async () => 'barvalue',
        });
        ctx.defineProperty('type', {
          get: async () => ({
            default: 'default',
            primary: 'primary',
            link: 'link',
            dashed: 'dashed',
            text: 'text',
          }),
        });
        ctx.onRefReady(ctx.ref, async (el) => {
          const json = await ctx.renderJson({
            foo: '{{ctx.foo}}',
            bar: '{{ctx.bar}}',
            type: '{{ctx.type.primary}}',
          });
          el.innerHTML = `<pre>${JSON.stringify(json, null, 2)}</pre>`;
        });
      },
    },
  },
});

class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ HelloBlockModel });
    this.flowEngine.context.defineProperty('foo', {
      get: async () => 'foovalue',
    });
    const model = this.flowEngine.createModel({
      uid: 'my-model',
      use: 'HelloBlockModel',
    });
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

// 创建应用实例，注册插件
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
