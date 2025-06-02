import { observable } from '@formily/reactive';
import { uid } from '@formily/shared';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Tabs } from 'antd';
import React from 'react';

class HelloFlowModel extends FlowModel {
  tabs: Array<any>;

  onInit(options: any) {
    this.tabs = observable(options.tabs || []);
  }

  addTab(tab: any) {
    this.tabs.push(tab);
  }

  render() {
    return (
      <div>
        <Tabs
          items={this.tabs.slice()}
          tabBarExtraContent={
            <Button onClick={() => this.addTab({ key: uid(), label: `Tab -${uid()}` })}>Add Tab</Button>
          }
        />
      </div>
    );
  }
}

// 插件定义
class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.registerModels({ HelloFlowModel });
    const model = this.flowEngine.createModel<HelloFlowModel>({
      use: 'HelloFlowModel',
      tabs: [
        { key: uid(), label: 'Tab 1' },
        { key: uid(), label: 'Tab 2' },
      ],
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
