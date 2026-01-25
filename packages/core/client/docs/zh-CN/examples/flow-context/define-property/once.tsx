import { uid } from '@formily/shared';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Card, Space } from 'antd';
import React from 'react';

// 带 once 的属性
class OnceModel extends FlowModel {
  onInit() {
    this.context.defineProperty('once', {
      get: () => `1-${uid()}`,
      once: true,
    });
    // 这次不会生效
    this.context.defineProperty('once', {
      get: () => `2-${uid()}`,
    });
  }
  render() {
    return (
      <Card title="带 once 的属性（仅首次定义生效）">
        <div style={{ marginBottom: 8, color: '#888' }}>只会采用第一次 defineProperty 的定义，后续不会覆盖</div>
        <div>第一次读取: {this.context.once}</div>
        <div>第二次读取: {this.context.once}</div>
      </Card>
    );
  }
}

// 不带 once 的属性
class NoOnceModel extends FlowModel {
  onInit() {
    this.context.defineProperty('noonce', {
      get: () => `3-${uid()}`,
    });
    // 这次会生效，覆盖上面的定义
    this.context.defineProperty('noonce', {
      get: () => `4-${uid()}`,
    });
  }
  render() {
    return (
      <Card title="不带 once 的属性（每次定义都会覆盖）">
        <div style={{ marginBottom: 8, color: '#888' }}>后定义会覆盖前面的定义，始终以最后一次为准</div>
        <div>第一次读取: {this.context.noonce}</div>
        <div>第二次读取: {this.context.noonce}</div>
      </Card>
    );
  }
}

class HelloModel extends FlowModel {
  render() {
    return (
      <Space direction="vertical">
        {this.mapSubModels('examples', (model) => (
          <FlowModelRenderer key={model.uid} model={model} />
        ))}
      </Space>
    );
  }
}

class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ HelloModel, OnceModel, NoOnceModel });
    const model = this.flowEngine.createModel({
      use: 'HelloModel',
      subModels: {
        examples: [{ use: 'OnceModel' }, { use: 'NoOnceModel' }],
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
