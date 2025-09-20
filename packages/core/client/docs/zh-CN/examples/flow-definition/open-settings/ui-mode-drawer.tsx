// uiSchema 通过字符串引用组件，示例无需直接导入控件
import { Application, Plugin } from '@nocobase/client';
import { defineFlow, FlowModel } from '@nocobase/flow-engine';
import { Button } from 'antd';
import React from 'react';

class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}

const flow = defineFlow({
  key: 'button',
  title: '按钮设置',
  steps: {
    general: {
      title: '通用配置',
      uiSchema: {
        title: { type: 'string', title: '按钮标题', 'x-decorator': 'FormItem', 'x-component': 'Input' },
      },
      handler(ctx, p) {
        ctx.model.setProps('children', p.title);
      },
    },
  },
});

MyModel.registerFlow(flow);

function Page({ model }: { readonly model: MyModel }) {
  return <Button onClick={() => model.openFlowSettings({ flowKey: 'button', uiMode: 'drawer' })}>抽屉模式</Button>;
}

class PluginHello extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ MyModel });
    const model = this.flowEngine.createModel<MyModel>({ uid: 'm4', use: 'MyModel' });
    this.router.add('root', { path: '/', element: <Page model={model} /> });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHello],
});

export default app.getRootComponent();
