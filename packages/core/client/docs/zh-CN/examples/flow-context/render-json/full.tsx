import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
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
        ctx.defineProperty('current', {
          get: async () => {
            return {
              key1: 'val1',
              key2: null,
              key3: 3,
              key4: { k: 'v' },
              key5: [1, 2, 3],
              key6: undefined,
            };
          },
        });
        ctx.onRefReady(ctx.ref, async (el) => {
          const json = await ctx.resolveJsonTemplate({
            key1: '{{ctx.current.key1}}',
            key2: '{{ctx.current.key2}}',
            key3: '{{ctx.current.key3}}',
            key4: '{{ctx.current.key4}}',
            key5: '{{ctx.current.key5}}',
            key6: '{{ctx.current.key6}}',
            key7: {
              key1: '{{ctx.current.key1}}',
              key2: '{{ctx.current.key2}}',
            },
            key8: ['{{ctx.current.key1}}', '{{ctx.current.key3}}', '{{ctx.current.key6}}'],
            key9: '{{ctx.current.key1}} - "{{ctx.current.key3}}" - {{ctx.current.key3}} - val9',
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
      get: async () => 123,
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
