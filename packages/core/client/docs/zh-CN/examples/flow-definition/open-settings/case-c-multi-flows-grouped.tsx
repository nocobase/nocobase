// uiSchema 通过字符串引用组件，示例无需直接导入控件
import { Application, Plugin } from '@nocobase/client';
import { defineFlow, FlowModel } from '@nocobase/flow-engine';
import { Button, Space } from 'antd';
import React from 'react';

class MyModel extends FlowModel {
  render() {
    return <Space>{/* 按钮只是为了触发配置弹窗 */}</Space>;
  }
}

const flowA = defineFlow({
  key: 'flowA',
  title: 'Flow A',
  steps: {
    s1: {
      title: 'A-配置',
      uiSchema: {
        a: { type: 'string', title: 'A 值', 'x-decorator': 'FormItem', 'x-component': 'Input' },
      },
      handler(ctx, p) {
        ctx.model.setProps('a', p.a);
      },
    },
  },
});

const flowB = defineFlow({
  key: 'flowB',
  title: 'Flow B',
  steps: {
    s1: {
      title: 'B-配置',
      uiSchema: {
        b: { type: 'string', title: 'B 值', 'x-decorator': 'FormItem', 'x-component': 'Input' },
      },
      handler(ctx, p) {
        ctx.model.setProps('b', p.b);
      },
    },
  },
});

MyModel.registerFlow(flowA);
MyModel.registerFlow(flowB);

function Page({ model }: { readonly model: MyModel }) {
  return <Button onClick={() => model.openFlowSettings({ flowKeys: ['flowA', 'flowB'] })}>打开多个 Flow 分组</Button>;
}

class PluginHello extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ MyModel });
    const model = this.flowEngine.createModel<MyModel>({ uid: 'm3', use: 'MyModel' });
    this.router.add('root', { path: '/', element: <Page model={model} /> });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHello],
});

export default app.getRootComponent();
