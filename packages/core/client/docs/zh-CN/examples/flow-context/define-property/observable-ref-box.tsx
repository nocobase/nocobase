import { observable } from '@formily/reactive';
import { uid } from '@formily/shared';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Card, Space } from 'antd';
import React from 'react';

class HelloModel extends FlowModel {
  onInit() {
    this.context.defineProperty('refValue', {
      get: () => observable.ref(uid()),
    });
    this.context.defineProperty('boxValue', {
      get: () => observable.box(uid()),
    });
  }
  render() {
    return (
      <Space direction="vertical">
        <Space>
          <Button
            onClick={() => {
              this.context.refValue.value = uid();
            }}
          >
            刷新 observable.ref 属性值
          </Button>
          <Button
            onClick={() => {
              this.context.boxValue.set(uid());
            }}
          >
            刷新 observable.box 属性值
          </Button>
        </Space>
        {this.mapSubModels('examples', (model) => (
          <FlowModelRenderer key={model.uid} model={model} />
        ))}
      </Space>
    );
  }
}

class Cache1Model extends FlowModel {
  render() {
    return (
      <Card title="refValue" style={{ width: 340 }}>
        <div>第一次读取: {this.context.refValue.value}</div>
        <div>第二次读取: {this.context.refValue.value}</div>
      </Card>
    );
  }
}

class Cache2Model extends FlowModel {
  render() {
    return (
      <Card title="boxValue" style={{ width: 340 }}>
        <div>第一次读取: {this.context.boxValue.get()}</div>
        <div>第二次读取: {this.context.boxValue.get()}</div>
      </Card>
    );
  }
}

class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ HelloModel, Cache1Model, Cache2Model });
    const model = this.flowEngine.createModel({
      use: 'HelloModel',
      subModels: {
        examples: [{ use: 'Cache1Model' }, { use: 'Cache2Model' }],
      },
    });
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
