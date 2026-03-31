import { uid } from '@formily/shared';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Card, Space } from 'antd';
import React from 'react';

export interface DefaultStructure {
  parent?: FlowModel;
  subModels: {
    sub1: HelloSubModel;
  };
}

class HelloModel extends FlowModel<DefaultStructure> {
  render() {
    const fork1 = this.subModels.sub1.createFork({}, 'fork1');
    const fork2 = this.subModels.sub1.createFork({}, 'fork2');
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloModel.</p>
        <Space direction="vertical">
          <FlowModelRenderer model={fork1} />
          <FlowModelRenderer model={fork2} />
        </Space>
      </div>
    );
  }
}

class HelloSubModel extends FlowModel {
  render() {
    return (
      <Card>
        <p>
          <strong>Hello, SubModel - {uid()}</strong>
        </p>
        <p>This is a sub-model rendered by HelloSubModel.</p>
      </Card>
    );
  }
}

class PluginHelloModel extends Plugin {
  async load() {
    // 注册 HelloModel 到 flowEngine
    this.flowEngine.registerModels({ HelloModel, HelloSubModel });

    // 创建 HelloModel 的实例（仅用于示例）
    const model = this.flowEngine.createModel({
      use: 'HelloModel',
      subModels: {
        sub1: {
          use: 'HelloSubModel',
        },
      },
    });

    // 添加路由，将模型渲染到根路径（仅用于示例）
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

// 创建应用实例，注册插件（仅用于示例）
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
