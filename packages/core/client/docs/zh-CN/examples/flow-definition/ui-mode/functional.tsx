import { Application, Plugin } from '@nocobase/client';
import { defineFlow, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button } from 'antd';
import React from 'react';

class FunctionalModel extends FlowModel {
  toggleMode = () => {
    this.setProps('isDrawerMode', !this.getProps().isDrawerMode);
  };

  render() {
    const { isDrawerMode } = this.getProps();
    return <Button onClick={() => this.toggleMode()}>切换模式: {isDrawerMode ? '抽屉' : '弹窗'}</Button>;
  }
}

const functionalUIMode = defineFlow<FunctionalModel>({
  key: 'functionalUIMode',
  title: '函数式 UI 模式示例',
  steps: {
    // 根据模式动态选择 UI 类型
    dynamicMode: {
      title: '动态模式选择',
      uiMode: (ctx) => {
        // 根据模型状态决定使用对话框还是抽屉
        return ctx.model.getProps()['isDrawerMode'] ? 'drawer' : 'dialog';
      },
      uiSchema: {
        content: {
          type: 'string',
          title: '内容',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        mode: {
          type: 'string',
          title: '当前模式',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-component-props': {
            disabled: true,
          },
        },
      },
      defaultParams: (ctx) => ({
        mode: ctx.model.getProps()['isDrawerMode'] ? '抽屉模式（抽屉）' : '弹窗模式（对话框）',
      }),
      handler(ctx, params) {
        console.log('动态模式参数:', params);
      },
    },

    // 带属性的动态配置
    propsMode: {
      title: '属性配置',
      uiMode: (ctx) => {
        const isDrawerMode = ctx.model.getProps()['isDrawerMode'];
        return {
          type: isDrawerMode ? 'drawer' : 'dialog',
          props: {
            width: isDrawerMode ? 600 : 400,
            centered: !isDrawerMode,
            styles: {
              mask: {
                backgroundColor: isDrawerMode ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)',
              },
            },
          },
        };
      },
      uiSchema: {
        message: {
          type: 'string',
          title: '消息',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      handler(ctx, params) {
        console.log('属性配置参数:', params);
      },
    },
  },
});

FunctionalModel.registerFlow(functionalUIMode);

class FunctionalUIPlugin extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ FunctionalModel });

    const model = this.flowEngine.createModel({
      uid: 'functional-ui-model',
      use: 'FunctionalModel',
    });

    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} showFlowSettings={true} />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [FunctionalUIPlugin],
});

export default app.getRootComponent();
