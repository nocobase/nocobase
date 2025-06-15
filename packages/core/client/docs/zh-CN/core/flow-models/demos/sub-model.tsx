import { observable } from '@formily/reactive';
import { uid } from '@formily/shared';
import { Application, Plugin } from '@nocobase/client';
import { CreateModelOptions, FlowModel, FlowModelRenderer, IFlowModelRepository } from '@nocobase/flow-engine';
import { Button, Tabs } from 'antd';
import _ from 'lodash';
import React from 'react';

class FlowModelRepository implements IFlowModelRepository<FlowModel<{parent: never, subModels: { tabs: TabFlowModel[] } }>> {
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
    const json: FlowModel = JSON.parse(data);
    for (const model of this.models.values()) {
      if (model.parentId === uid) {
        json.subModels = json.subModels || {};
        if (model.subType === 'array') {
          json.subModels[model.subKey] = json.subModels[model.subKey] || [];
          const subModel = await this.load(model.uid);
          if (subModel) {
            (json.subModels[model.subKey] as FlowModel[]).push(subModel);
          }
        } else if (model.subType === 'object') {
          const subModel = await this.load(model.uid);
          json.subModels[model.subKey] = subModel;
        }
      }
    }
    return json;
  }

  // 将模型数据保存到本地存储
  async save(model: FlowModel) {
    const data = model.serialize();
    const currentData = _.omit(data, [...Object.keys(model.subModels)]);
    localStorage.setItem(`flow-model:${model.uid}`, JSON.stringify(currentData));
    for (const subModelKey of Object.keys(model.subModels)) {
      if (!model.subModels[subModelKey]) continue;
      if (Array.isArray(model.subModels[subModelKey])) {
        model.subModels[subModelKey].forEach((subModel: FlowModel) => {
          localStorage.setItem(`flow-model:${subModel.uid}`, JSON.stringify(subModel.serialize()));
        });
      } else if (model.subModels[subModelKey] instanceof FlowModel) {
        localStorage.setItem(`flow-model:${model.subModels[subModelKey].uid}`, JSON.stringify(model.subModels[subModelKey].serialize()));
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

class HelloFlowModel extends FlowModel<{parent: never, subModels: { tabs: TabFlowModel[] } }> {

  addTab(tab: any) {
    // 使用新的 addSubModel API 添加子模型
    const model = this.addSubModel('tabs', tab);
    model.save();
    return model;
  }

  render() {
    return (
      <div>
        <Tabs
          items={this.subModels.tabs?.map((tab) => ({
            key: tab.getProps().key,
            label: tab.getProps().label,
            children: tab.render()
          }))}
          tabBarExtraContent={
            <Button
              onClick={() => {
                const tabId = uid();
                this.addTab({
                  use: 'TabFlowModel',
                  uid: tabId,
                  props: { key: tabId, label: `Tab - ${tabId}` },
                })
              }}
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
      subModels: {
        tabs: [
          {
            use: 'TabFlowModel',
            uid: 'tab-1',
            props: { key: 'tab-1', label: 'Tab 1' },
          },
          {
            use: 'TabFlowModel',
            uid: 'tab-2',
            props: { key: 'tab-2', label: 'Tab 2' },
          },
        ],
      }
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
