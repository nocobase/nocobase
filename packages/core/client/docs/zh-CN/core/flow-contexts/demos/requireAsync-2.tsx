import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer, JSRunner } from '@nocobase/flow-engine';
import { Button } from 'antd';
import React from 'react';

class HelloBlockModel extends FlowModel {
  render() {
    return (
      <div>
        <div ref={this.context.ref}></div>
        <div style={{ textAlign: 'center' }}>
          <Button
            onClick={() => {
              this.rerender();
            }}
          >
            Shuffle
          </Button>
        </div>
      </div>
    );
  }
}

HelloBlockModel.registerFlow({
  key: 'ref-example',
  title: 'Ref Example',
  steps: {
    refReady: {
      handler: async (ctx) => {
        ctx.onRefReady(ctx.ref, async (element) => {
          ctx.defineProperty('element', {
            get: () => element,
          });
          await ctx.runjs(`
            const _ = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js');
            const arr = [1, 2, 3, 4, 5];
            const shuffled = _.shuffle(arr);
            ctx.element.innerHTML = \`
              <div>
                <div>原数组: \${JSON.stringify(arr)}</div>
                <div >乱序后: \${JSON.stringify(shuffled)}</div>
              </div>
            \`;
          `);
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
