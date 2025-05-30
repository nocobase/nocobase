import { Input } from '@formily/antd-v5';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelComponent, FlowsSettings } from '@nocobase/flow-engine';
import { Card } from 'antd';
import React, { createRef } from 'react';

function waitForRefCallback<T extends HTMLElement>(ref: React.RefObject<T>, cb: (el: T) => void, timeout = 3000) {
  const start = Date.now();
  function check() {
    if (ref.current) return cb(ref.current);
    if (Date.now() - start > timeout) return;
    setTimeout(check, 30);
  }
  check();
}

class RefFlowModel extends FlowModel {
  ref = createRef<HTMLDivElement>();
  render() {
    return (
      <Card>
        <div ref={this.ref} />
      </Card>
    );
  }
}

RefFlowModel.registerFlow('defaultFlow', {
  autoApply: true,
  steps: {
    step1: {
      async handler(ctx, model: RefFlowModel) {
        waitForRefCallback(model.ref, (el) => {
          el.innerHTML = 'Hello, NocoBase!';
        });
      },
    },
  },
});

// 插件定义
class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.registerModels({ RefFlowModel });
    const model = this.flowEngine.createModel({
      use: 'RefFlowModel',
      stepParams: {
        defaultFlow: {
          step1: {},
        },
      },
    });
    this.router.add('root', {
      path: '/',
      element: (
        <div>
          <FlowModelComponent model={model} />
          <br />
          <FlowsSettings model={model} />
        </div>
      ),
    });
  }
}

// 创建应用实例
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
