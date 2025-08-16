import { uid } from '@formily/shared';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button } from 'antd';
import React from 'react';

class HelloModel extends FlowModel {
  onInit() {
    this.context.defineProperty('cached', {
      get: () => uid(),
      // 默认 cache: true
    });
  }
  render() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
    return (
      <div>
        <h4>带缓存的属性（cached）</h4>
        <div>第一次读取: {this.context.cached}</div>
        <div>第二次读取: {this.context.cached}</div>
        <Button
          onClick={() => {
            this.context.removeCache('cached');
            forceUpdate();
          }}
        >
          清除 cached 缓存并刷新
        </Button>
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
