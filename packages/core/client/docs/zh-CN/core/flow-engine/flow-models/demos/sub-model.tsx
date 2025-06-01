import { observable } from '@formily/reactive';
import { uid } from '@formily/shared';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer, IFlowModelRepository } from '@nocobase/flow-engine';
import { Button, Tabs } from 'antd';
import _ from 'lodash';
import React from 'react';

class FlowModelRepository implements IFlowModelRepository<FlowModel> {
  get models() {
    const models = new Map();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('flow-model:')) {
        const data = localStorage.getItem(key);
        if (data) {
          const model = JSON.parse(data);
          models.set(model.uid, model);
        }
      }
    }
    return models;
  }

  // 从本地存储加载模型数据
  async load(uid: string) {
    const data = localStorage.getItem(`flow-model:${uid}`);
    if (!data) return null;
    const json = JSON.parse(data);
    for (const model of this.models.values()) {
      if (model.parentId === uid) {
        if (model.subType === 'array') {
          json[model.subKey] = json[model.subKey] || [];
          const subModel = await this.load(model.uid);
          json[model.subKey].push(subModel);
        } else if (model.subType === 'object') {
          const subModel = await this.load(model.uid);
          json[model.subKey] = subModel;
        }
      }
    }
    return json;
  }

  // 将模型数据保存到本地存储
  async save(model: FlowModel) {
    const data = model.serialize();
    const currentData = _.omit(data, [...model.subModelKeys]);
    localStorage.setItem(`flow-model:${model.uid}`, JSON.stringify(currentData));
    for (const subModelKey of model.subModelKeys) {
      if (!model[subModelKey]) continue;
      if (Array.isArray(model[subModelKey])) {
        model[subModelKey].forEach((subModel: FlowModel) => {
          localStorage.setItem(`flow-model:${subModel.uid}`, JSON.stringify(subModel.serialize()));
        });
      } else if (model[subModelKey] instanceof FlowModel) {
        localStorage.setItem(`flow-model:${model[subModelKey].uid}`, JSON.stringify(model[subModelKey].serialize()));
      }
    }
    return data;
  }

  // 从本地存储中删除模型数据
  async destroy(uid: string) {
    localStorage.removeItem(`flow-model:${uid}`);
    return true;
  }
}

class TabFlowModel extends FlowModel {}

class HelloFlowModel extends FlowModel {
  tabs: Array<any>;

  onInit(options: any) {
    const tabs = options.tabs || [];
    this.tabs = observable.shallow([]);
    tabs.forEach((tab: any) => {
      this.addSubModel('tabs', tab);
    });
  }

  addTab(tab: any) {
    const model = this.addSubModel('tabs', tab);
    model.save();
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
    this.flowEngine.setModelRepository(new FlowModelRepository());
    this.flowEngine.registerModels({ HelloFlowModel, TabFlowModel });
    const model = await this.flowEngine.loadOrCreateModel({
      uid: 'sub-model-test',
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
