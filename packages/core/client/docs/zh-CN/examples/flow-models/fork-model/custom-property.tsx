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
  text: string;
  ref = React.createRef<HTMLDivElement>();
  render() {
    return (
      <Card>
        <h3>{this.text}</h3>
        <div ref={this.ref}></div>
      </Card>
    );
  }
  protected onMount(): void {
    // 在组件挂载时执行一些操作
    if (this.ref.current) {
      this.rerender();
    }
  }
}

HelloSubModel.registerFlow({
  key: 'sub-model-example',
  auto: true,
  steps: {
    test: {
      handler: async (ctx) => {
        ctx.model.text = `Text - ${uid()}`;
        ctx.onRefReady(ctx.model.ref, (el) => {
          el.innerHTML = `<h3>el.innerHTML - ${uid()}</h3>`;
        });
      },
    },
  },
});

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
