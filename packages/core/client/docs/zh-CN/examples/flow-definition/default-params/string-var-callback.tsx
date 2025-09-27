import * as icons from '@ant-design/icons';
import { FormItem, FormLayout, Input, Select } from '@formily/antd-v5';
import { Application, Plugin } from '@nocobase/client';
import { defineFlow, escapeT, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button } from 'antd';
import React from 'react';

// 自定义模型类，继承自 FlowModel
class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}

const buttonSettings = defineFlow({
  key: 'buttonSettings',
  title: '按钮设置',
  steps: {
    general: {
      title: '通用配置',
      uiSchema: {
        type: {
          type: 'string',
          title: '类型',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      defaultParams: () => ({
        type: '{{ctx.type.primary}}',
      }),
      // 步骤处理函数，设置模型属性
      handler(ctx, params) {
        ctx.model.setProps('children', params.title);
        ctx.model.setProps('type', params.type);
        ctx.model.setProps('icon', params.icon ? React.createElement(icons[params.icon]) : undefined);
      },
    },
  },
});

MyModel.registerFlow(buttonSettings);

// 插件类，负责注册模型、仓库，并加载或创建模型实例
class PluginHelloModel extends Plugin {
  async load() {
    // 启用 Flow Settings
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ MyModel });
    this.flowEngine.context.defineProperty('type', {
      value: {
        default: 'default',
        primary: 'primary',
        link: 'link',
        dashed: 'dashed',
        text: 'text',
      },
    });
    const model = this.flowEngine.createModel({
      uid: 'my-model',
      use: 'MyModel',
      stepParams: {
        buttonSettings: {
          general: {
            title: 'Primary Button',
          },
        },
      },
    });
    // 注册路由，渲染模型
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} showFlowSettings={true} />,
    });
  }
}

// 创建应用实例，注册插件
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
