import * as icons from '@ant-design/icons';
import { Application, Plugin } from '@nocobase/client';
import { defineFlow, FlowModel, FlowModelRenderer, useFlowSettingsContext } from '@nocobase/flow-engine';
import { Button, Skeleton } from 'antd';
import React from 'react';

import { connect, ReactFC } from '@formily/react';
import { useRequest } from 'ahooks';
import { Select as AntdSelect, SelectProps } from 'antd';

// 自定义模型类，继承自 FlowModel
class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}

export const MySelect: ReactFC<SelectProps<any, any>> = connect((props: SelectProps) => {
  const ctx = useFlowSettingsContext();
  const { loading = true, data } = useRequest(async () => {
    return await ctx.types;
  });
  if (loading) {
    return <Skeleton.Input style={{ width: '100%' }} />;
  }
  return <AntdSelect options={data} {...props} />;
});

const buttonSettings = defineFlow({
  key: 'buttonSettings',
  title: '按钮设置',
  steps: {
    general: {
      title: '通用配置',
      uiSchema: async (ctx) => ({
        type: {
          type: 'string',
          title: '类型',
          'x-decorator': 'FormItem',
          'x-component': 'MySelect',
        },
      }),
      defaultParams: {
        type: 'primary',
      },
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

function sleep(ms = 1000) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// 插件类，负责注册模型、仓库，并加载或创建模型实例
class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.flowSettings.registerComponents({ MySelect });
    // 启用 Flow Settings
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ MyModel });
    // 模拟获取类型列表
    this.flowEngine.context.defineProperty('types', {
      async get() {
        await sleep(3000); // 模拟延迟
        return [
          { label: '主要', value: 'primary' },
          { label: '次要', value: 'default' },
          { label: '危险', value: 'danger' },
          { label: '虚线', value: 'dashed' },
          { label: '链接', value: 'link' },
          { label: '文本', value: 'text' },
        ];
      },
    });
    const model = this.flowEngine.createModel({
      uid: 'my-model',
      use: 'MyModel',
      stepParams: {
        buttonSettings: {
          general: {
            title: 'Primary Button',
            type: 'primary',
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
