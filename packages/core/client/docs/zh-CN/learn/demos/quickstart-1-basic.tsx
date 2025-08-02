import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button } from 'antd';
import React from 'react';

// 自定义模型类，继承自 FlowModel
class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}

// 插件类，负责注册模型、仓库，并加载或创建模型实例
class PluginHelloModel extends Plugin {
  async load() {
    // 注册自定义模型
    this.flowEngine.registerModels({ MyModel });
    const model = this.flowEngine.createModel({
      uid: 'my-model',
      use: 'MyModel',
      props: {
        type: 'primary',
        children: 'Primary Button',
      },
    });
    // 注册路由，渲染模型
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

// 创建应用实例，注册插件
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
