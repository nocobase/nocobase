import { FormItem, Input, Select } from '@formily/antd-v5';
import { Application, Plugin } from '@nocobase/client';
import { defineFlow, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button } from 'antd';
import React from 'react';

// 基础 UI Mode 示例：展示字符串形式的 uiMode
class BasicModel extends FlowModel {
  render() {
    return <Button {...this.props}>基础示例</Button>;
  }
}

const basicUIMode = defineFlow({
  key: 'basicUIMode',
  title: '基础 UI 模式示例',
  steps: {
    // 对话框模式（默认）
    dialogStep: {
      title: '对话框配置',
      uiMode: 'dialog', // 字符串形式
      uiSchema: {
        message: {
          type: 'string',
          title: '消息内容',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        priority: {
          type: 'string',
          title: '优先级',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          enum: [
            { label: '高', value: 'high' },
            { label: '中', value: 'medium' },
            { label: '低', value: 'low' },
          ],
        },
      },
      handler(ctx, params) {
        console.log('对话框参数:', params);
      },
    },

    // 抽屉模式
    drawerStep: {
      title: '抽屉配置',
      uiMode: 'drawer', // 字符串形式
      uiSchema: {
        title: {
          type: 'string',
          title: '标题',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        description: {
          type: 'string',
          title: '描述',
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      handler(ctx, params) {
        console.log('抽屉参数:', params);
      },
    },
  },
});

BasicModel.registerFlow(basicUIMode);

class BasicUIPlugin extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ BasicModel });

    const model = this.flowEngine.createModel({
      uid: 'basic-ui-model',
      use: 'BasicModel',
    });

    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} showFlowSettings={true} />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [BasicUIPlugin],
});

export default app.getRootComponent();
