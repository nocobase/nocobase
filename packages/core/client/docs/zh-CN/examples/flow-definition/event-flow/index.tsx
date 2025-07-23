import * as icons from '@ant-design/icons';
import { Application, Plugin } from '@nocobase/client';
import { defineFlow, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button } from 'antd';
import React from 'react';

// 自定义模型类，继承自 FlowModel
class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}

const myPropsFlow = defineFlow({
  key: 'buttonSettings',
  auto: true,
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
            { label: '危险', value: 'danger' },
            { label: '虚线', value: 'dashed' },
            { label: '链接', value: 'link' },
            { label: '文本', value: 'text' },
          ],
        },
        icon: {
          type: 'string',
          title: '图标',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          enum: [
            { label: '搜索', value: 'SearchOutlined' },
            { label: '添加', value: 'PlusOutlined' },
            { label: '删除', value: 'DeleteOutlined' },
            { label: '编辑', value: 'EditOutlined' },
            { label: '设置', value: 'SettingOutlined' },
          ],
        },
      },
      defaultParams: {
        type: 'primary',
      },
      // 步骤处理函数，设置模型属性
      handler(ctx, params) {
        ctx.model.setProps('children', params.title);
        ctx.model.setProps('type', params.type);
        ctx.model.setProps('icon', params.icon ? React.createElement(icons[params.icon]) : undefined);
        ctx.model.setProps('onClick', (event) => {
          ctx.model.dispatchEvent('click', { event });
        });
      },
    },
  },
});

const myEventFlow = defineFlow({
  key: 'clickSettings',
  on: 'click',
  title: '按钮事件',
  steps: {
    confirm: {
      title: '确认操作配置',
      uiSchema: {
        title: {
          type: 'string',
          title: '弹窗提示标题',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        content: {
          type: 'string',
          title: '弹窗提示内容',
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      defaultParams: {
        title: '确认操作',
        content: '你点击了按钮，是否确认？',
      },
      async handler(ctx, params) {
        const confirmed = await ctx.modal.confirm({
          title: params.title,
          content: params.content,
        });
        await ctx.message.info(`你点击了按钮，确认结果：${confirmed ? '确认' : '取消'}`);
      },
    },
  },
});

MyModel.registerFlow(myPropsFlow);
MyModel.registerFlow(myEventFlow);

// 插件类，负责注册模型、仓库，并加载或创建模型实例
class PluginHelloModel extends Plugin {
  async load() {
    // 启用 Flow Settings
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ MyModel });
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
      element: <FlowModelRenderer model={model} showFlowSettings />,
    });
  }
}

// 创建应用实例，注册插件
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
