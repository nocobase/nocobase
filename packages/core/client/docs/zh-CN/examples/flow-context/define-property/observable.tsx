import { uid } from '@formily/shared';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Card, Space } from 'antd';
import React from 'react';

class HelloModel extends FlowModel {
  onInit() {
    this.context.defineProperty('cached', {
      get: () => uid(),
      observable: true, // 默认 cache: true
    });
  }
  render() {
    return (
      <Space direction="vertical">
        <Button
          onClick={() => {
            this.context.removeCache('cached');
          }}
        >
          刷新属性值
        </Button>
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
      <Card title="带缓存的属性（cached）" style={{ width: 340 }}>
        <div>第一次读取: {this.context.cached}</div>
        <div>第二次读取: {this.context.cached}</div>
      </Card>
    );
  }
}

class Cache2Model extends FlowModel {
  render() {
    return (
      <Card title="带缓存的属性（cached）" style={{ width: 340 }}>
        <div>第一次读取: {this.context.cached}</div>
        <div>第二次读取: {this.context.cached}</div>
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
