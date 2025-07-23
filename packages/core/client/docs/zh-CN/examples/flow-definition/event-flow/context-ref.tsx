import { Application, BlockModel, Plugin } from '@nocobase/client';
import { defineFlow, FlowModelRenderer } from '@nocobase/flow-engine';
import { Card } from 'antd';
import React from 'react';

// 自定义模型类，继承自 FlowModel
class MyCollectionBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>欢迎来到 NocoBase！</h1>
        <p>这是由 MyCollectionBlockModel 渲染的示例区块。</p>
      </div>
    );
  }
}

const myPropsFlow = defineFlow<MyCollectionBlockModel>({
  key: 'buttonSettings',
  auto: true,
  steps: {
    bindEvent: {
      handler(ctx, params) {
        ctx.onRefReady(ctx.ref, (element) => {
          console.log('Element is ready:', element);
          element.onclick = (event) => {
            ctx.model.dispatchEvent('click', { event });
          };
        });
      },
    },
  },
});

const myEventFlow = defineFlow({
  key: 'clickSettings',
  on: 'click',
  title: '事件配置',
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
        content: '你点击了卡片，是否确认？',
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

MyCollectionBlockModel.registerFlow(myPropsFlow);
MyCollectionBlockModel.registerFlow(myEventFlow);

// 插件类，负责注册模型、仓库，并加载或创建模型实例
class PluginHelloModel extends Plugin {
  async load() {
    // 启用 Flow Settings
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ MyCollectionBlockModel });
    const model = this.flowEngine.createModel({
      uid: 'my-model',
      use: 'MyCollectionBlockModel',
    });
    // 注册路由，渲染模型
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

// 创建应用实例，注册插件
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
