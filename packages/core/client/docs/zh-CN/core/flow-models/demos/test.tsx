import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { use } from 'i18next';
import React from 'react';

class MyModel extends FlowModel<any> {
  render() {
    return (
      <span>
        <FlowModelRenderer model={this.subModels.sub} showFlowSettings />
      </span>
    );
  }
}

class MySubModel extends FlowModel {}

MySubModel.registerFlow({
  key: 'sub',
  steps: {
    step1: {
      uiSchema: {
        model: {
          type: 'string',
          title: 'Select Model',
          'x-component': 'Select',
          'x-decorator': 'FormItem',
          enum: [
            { label: 'MySub1Model', value: 'MySub1Model' },
            { label: 'MySub2Model', value: 'MySub2Model' },
          ],
        },
      },
      defaultParams: (ctx) => {
        return {
          model: ctx.model.use,
        };
      },
      handler(ctx, params) {
        if (ctx.model.use !== params.model) {
          const newModel = ctx.engine.createModel({
            use: params.model,
          });
          ctx.model.parent.replaceSubModel(ctx.model, newModel);
        }
      },
    },
  },
});

class MySub1Model extends MySubModel {
  render() {
    return <span>MySub1Model</span>;
  }
}

class MySub2Model extends MySubModel {
  render() {
    return <span>MySub2Model</span>;
  }
}

// 插件类，负责注册模型、仓库，并加载或创建模型实例
class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ MyModel, MySubModel, MySub1Model, MySub2Model });
    const model = this.flowEngine.createModel({
      uid: 'my-model',
      use: 'MyModel',
      props: {
        type: 'primary',
        children: 'Primary Button',
      },
      subModels: {
        sub: {
          use: 'MySub1Model',
        },
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
