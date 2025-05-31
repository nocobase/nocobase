import { observable } from '@formily/reactive';
import { uid } from '@formily/shared';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Tabs } from 'antd';
import React from 'react';

class TabFlowModel extends FlowModel {}

class HelloFlowModel extends FlowModel {
  tabs: Array<any>;

  onInit(options: any) {
    const tabs = options.tabs || [];
    this.tabs = observable.shallow([]);
    tabs.forEach((tab: any) => {
      this.addTab(tab);
    });
  }

  addTab(tab: any) {
    const model = this.addSubModel('tabs', {
      ...tab,
    });
    this.tabs.push(model);
  }

  render() {
    return (
      <div>
        <Tabs
          items={this.tabs.map((tab) => tab.getProps())}
          tabBarExtraContent={
            <Button
              onClick={() =>
                this.addTab({
                  use: 'TabFlowModel',
                  props: { key: uid(), label: `Tab - ${uid()}` },
                })
              }
            >
              Add Tab
            </Button>
          }
        />
      </div>
    );
  }
}

// 插件定义
class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.registerModels({ HelloFlowModel, TabFlowModel });
    const model = this.flowEngine.createModel({
      use: 'HelloFlowModel',
      props: {
        name: 'NocoBase',
      },
      tabs: [
        {
          use: 'TabFlowModel',
          props: { key: uid(), label: 'Tab 1' },
        },
        {
          use: 'TabFlowModel',
          props: { key: uid(), label: 'Tab 2' },
        },
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
