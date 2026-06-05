// 展示 preset: true 的过滤行为，仅渲染被标记为预设的步骤
import { Application, Plugin } from '@nocobase/client';
import { defineFlow, FlowModel } from '@nocobase/flow-engine';
import { Button } from 'antd';
import React from 'react';

class MyModel extends FlowModel {}

const flow = defineFlow({
  key: 'settings',
  title: '设置示例',
  steps: {
    quick: {
      title: '快速配置',
      preset: true,
      uiSchema: {
        quickTitle: { type: 'string', title: '快速标题', 'x-decorator': 'FormItem', 'x-component': 'Input' },
      },
    },
    advanced: {
      title: '高级配置',
      uiSchema: {
        level: { type: 'number', title: '级别', 'x-decorator': 'FormItem', 'x-component': 'NumberPicker' },
      },
    },
  },
});

MyModel.registerFlow(flow);

function Page({ model }: { readonly model: MyModel }) {
  return (
    <Button onClick={() => model.openFlowSettings({ flowKey: 'settings', preset: true })}>仅渲染 preset 步骤</Button>
  );
}

class PluginHello extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ MyModel });
    const model = this.flowEngine.createModel<MyModel>({ uid: 'mpreset', use: 'MyModel' });
    this.router.add('root', { path: '/', element: <Page model={model} /> });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHello],
});

export default app.getRootComponent();
