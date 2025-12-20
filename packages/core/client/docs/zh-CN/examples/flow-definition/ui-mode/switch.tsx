import * as icons from '@ant-design/icons';
import { Application, Plugin } from '@nocobase/client';
import { defineFlow, FlowModel, FlowModelRenderer, tExpr } from '@nocobase/flow-engine';
import { Button, Card } from 'antd';
import React from 'react';

// 自定义模型类，继承自 FlowModel
class MyModel extends FlowModel {
  render() {
    return <Button title="Button" {...this.props} />;
  }
}

const buttonSettings = defineFlow({
  key: 'buttonSettings',
  steps: {
    switch1: {
      title: tExpr('Switch Configuration 1'),
      uiMode: {
        type: 'switch',
        key: 'enabled',
      },
      defaultParams: {
        enabled: true,
      },
    },
    switch2: {
      title: tExpr('Switch Configuration 2'),
      uiMode: {
        type: 'switch',
        key: 'enabled',
        props: {
          checkedChildren: tExpr('启用'),
          unCheckedChildren: tExpr('禁用'),
        },
      },
      defaultParams: {
        enabled: true,
      },
    },
  },
});

MyModel.registerFlow(buttonSettings);

// 插件类，负责注册模型、仓库，并加载或创建模型实例
class PluginHelloModel extends Plugin {
  async load() {
    // 启用 Flow Settings
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ MyModel });
    const model = this.flowEngine.createModel({
      uid: 'my-model',
      use: 'MyModel',
      stepParams: {
        buttonSettings: {
          general: {
            title: 'Primary Button',
            type: 'primary',
          },
        },
      },
    });
    // 注册路由，渲染模型
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} showFlowSettings={true} />,
    });
  }
}

// 创建应用实例，注册插件
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
