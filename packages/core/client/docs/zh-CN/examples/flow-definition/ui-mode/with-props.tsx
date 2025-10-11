import { FormItem, Input, Select, Switch } from '@formily/antd-v5';
import { Application, Plugin } from '@nocobase/client';
import { defineFlow, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button } from 'antd';
import React from 'react';

// 带属性的 UI Mode 示例：展示对象形式的 uiMode
class PropsModel extends FlowModel {
  render() {
    return <Button {...this.props}>属性示例</Button>;
  }
}

const propsUIMode = defineFlow({
  key: 'propsUIMode',
  title: '带属性的 UI 模式示例',
  steps: {
    // 自定义宽度的对话框
    customDialog: {
      title: '自定义对话框',
      uiMode: {
        type: 'dialog',
        props: {
          width: 900,
          centered: true,
          className: 'custom-dialog',
          styles: {
            mask: { backgroundColor: 'rgba(138, 43, 226, 0.25)' }, // 紫色半透明背景，更有区分度
          },
        },
      },
      uiSchema: {
        name: {
          type: 'string',
          title: '名称',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        email: {
          type: 'string',
          title: '邮箱',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        enabled: {
          type: 'boolean',
          title: '启用',
          'x-decorator': 'FormItem',
          'x-component': 'Switch',
        },
      },
      handler(ctx, params) {
        console.log('自定义对话框参数:', params);
      },
    },

    // 自定义宽度的抽屉
    customDrawer: {
      title: '自定义抽屉',
      uiMode: {
        type: 'drawer',
        props: {
          width: '70%',
          placement: 'right',
          className: 'custom-drawer',
          closable: true,
          maskClosable: false,
          styles: {
            mask: { backgroundColor: 'rgba(255, 140, 0, 0.2)' }, // 橙色半透明背景
          },
        },
      },
      uiSchema: {
        settings: {
          type: 'object',
          title: '高级设置',
          'x-decorator': 'FormItem',
          properties: {
            theme: {
              type: 'string',
              title: '主题',
              'x-decorator': 'FormItem',
              'x-component': 'Select',
              enum: [
                { label: '浅色', value: 'light' },
                { label: '深色', value: 'dark' },
                { label: '自动', value: 'auto' },
              ],
            },
            notifications: {
              type: 'boolean',
              title: '通知',
              'x-decorator': 'FormItem',
              'x-component': 'Switch',
            },
          },
        },
      },
      handler(ctx, params) {
        console.log('自定义抽屉参数:', params);
      },
    },
  },
});

PropsModel.registerFlow(propsUIMode);

class PropsUIPlugin extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ PropsModel });

    const model = this.flowEngine.createModel({
      uid: 'props-ui-model',
      use: 'PropsModel',
    });

    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} showFlowSettings={true} />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PropsUIPlugin],
});

export default app.getRootComponent();
