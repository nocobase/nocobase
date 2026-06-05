// no-op imports here; this file focuses on open() usage rather than field rendering in docs runtime
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
        title: {
          type: 'string',
          title: '按钮标题',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        type: {
          type: 'string',
          title: '类型',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          enum: [
            { label: '主要', value: 'primary' },
            { label: '次要', value: 'default' },
          ],
        },
      },
      defaultParams: { type: 'primary' },
      handler(ctx, params) {
        ctx.model.setProps('children', params.title);
        ctx.model.setProps('type', params.type);
      },
    },
  },
});

MyModel.registerFlow(flow);

function Page({ model }: { readonly model: MyModel }) {
  return (
    <Button onClick={() => model.openFlowSettings({ flowKey: 'button', stepKey: 'general', uiMode: 'dialog' })}>
      打开单步直出
    </Button>
  );
}

class PluginHello extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ MyModel });
    const model = this.flowEngine.createModel<MyModel>({
      uid: 'm1',
      use: 'MyModel',
      stepParams: {
        button: { general: { title: 'Primary Button', type: 'primary' } },
      },
    });
    this.router.add('root', { path: '/', element: <Page model={model} /> });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHello],
});

export default app.getRootComponent();
