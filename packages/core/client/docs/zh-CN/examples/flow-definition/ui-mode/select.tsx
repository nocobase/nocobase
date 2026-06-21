import * as icons from '@ant-design/icons';
import { Application, Plugin } from '@nocobase/client';
import { defineFlow, FlowModel, FlowModelRenderer, tExpr } from '@nocobase/flow-engine';
import { Button, Card } from 'antd';
import React from 'react';

// 自定义模型类，继承自 FlowModel
class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}

const buttonSettings = defineFlow({
  key: 'buttonSettings',
  title: '按钮设置',
  steps: {
    general: {
      title: '{{t("Select Example")}}',
      uiMode: {
        type: 'select',
        key: 'icon',
        props: {
          options: [
            { label: tExpr('选项一'), value: 'one' },
            { label: tExpr('选项二'), value: 'two' },
            { label: tExpr('选项三'), value: 'three' },
          ],
        }
      },
      defaultParams: {
        icon: 'two',
      },
      handler(ctx, params) {
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
