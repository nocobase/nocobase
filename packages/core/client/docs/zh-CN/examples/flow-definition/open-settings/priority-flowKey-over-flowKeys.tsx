// uiSchema 通过字符串引用组件，示例无需直接导入控件
import { Application, Plugin } from '@nocobase/client';
import { defineFlow, FlowModel } from '@nocobase/flow-engine';
import { Button } from 'antd';
import React from 'react';

class MyModel extends FlowModel {}

const flowA = defineFlow({
  key: 'A',
  title: 'Flow A',
  steps: {
    s: {
      title: 'A 配置',
      uiSchema: { a: { type: 'string', title: 'A', 'x-decorator': 'FormItem', 'x-component': 'Input' } },
    },
  },
});

const flowB = defineFlow({
  key: 'B',
  title: 'Flow B',
  steps: {
    s: {
      title: 'B 配置',
      uiSchema: { b: { type: 'string', title: 'B', 'x-decorator': 'FormItem', 'x-component': 'Input' } },
    },
  },
});

MyModel.registerFlow(flowA);
MyModel.registerFlow(flowB);

function Page({ model }: { readonly model: MyModel }) {
  return (
    <Button onClick={() => model.openFlowSettings({ flowKey: 'A', flowKeys: ['A', 'B'] })}>
      同时传入 flowKey 与 flowKeys（以 flowKey 为准）
    </Button>
  );
}

class PluginHello extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ MyModel });
    const model = this.flowEngine.createModel<MyModel>({ uid: 'm5', use: 'MyModel' });
    this.router.add('root', { path: '/', element: <Page model={model} /> });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHello],
});

export default app.getRootComponent();
