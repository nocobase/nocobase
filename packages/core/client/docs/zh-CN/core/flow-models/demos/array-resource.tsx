import { define, observable } from '@formily/reactive';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Input, Space } from 'antd';
import React from 'react';

class ArrayResource {
  meta = observable.shallow({
    filter: {},
    sort: [],
    page: 1,
    pageSize: 10,
    appends: [],
    data: [],
  });

  get data() {
    return this.meta.data;
  }

  set data(value) {
    this.meta.data = value;
  }

  getData() {
    return this.meta.data;
  }

  setData(data) {
    this.meta.data = data;
  }

  async next() {
    const newData = Array.from({ length: 3 }, (_, i) => ({
      id: Math.floor(Math.random() * 10000),
      name: `Item ${Math.floor(Math.random() * 100)}`,
    }));
    this.setData(newData);
  }

  async refresh() {
    const newData = Array.from({ length: 3 }, (_, i) => ({
      id: Math.floor(Math.random() * 10000),
      name: `Item ${Math.floor(Math.random() * 100)}`,
    }));
    this.setData(newData);
  }
}

class ArrayResourceFlowModel extends FlowModel {
  resource: ArrayResource = new ArrayResource();

  render() {
    return (
      <div>
        <pre>{JSON.stringify(this.resource.getData(), null, 2)}</pre>
        <Space>
          <Button
            onClick={() => {
              this.resource.refresh();
            }}
          >
            Refresh
          </Button>
          <Button
            onClick={() => {
              this.resource.next();
            }}
          >
            Next
          </Button>
        </Space>
      </div>
    );
  }
}

// 插件定义
class PluginTableBlockModel extends Plugin {
  async load() {
    this.flowEngine.registerModels({ ArrayResourceFlowModel });
    const model = this.flowEngine.createModel({
      use: 'ArrayResourceFlowModel',
    });
    this.router.add('root', {
      path: '/',
      element: (
        <div>
          <FlowModelRenderer model={model} />
        </div>
      ),
    });
  }
}

// 创建应用实例
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginTableBlockModel],
});

export default app.getRootComponent();
