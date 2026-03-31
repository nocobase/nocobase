import { Application, Plugin } from '@nocobase/client';
import { defineFlow, FlowModel, FlowModelRenderer, useFlowSettingsContext } from '@nocobase/flow-engine';
import { Alert, Tag } from 'antd';
import React from 'react';

// 自定义模型类，继承自 FlowModel
class MyModel extends FlowModel {
  render() {
    return <Tag {...this.props} />;
  }
}

function MyAlert() {
  // 获取流配置态的上下文
  const ctx = useFlowSettingsContext();
  return (
    <Alert
      message={`${ctx.model.constructor.name}-${ctx.model.uid}`}
      description="Success Description Success Description Success Description"
      type="success"
      style={{ marginTop: 24, marginBottom: 24 }}
    />
  );
}

const buttonSettings = defineFlow({
  key: 'buttonSettings',
  title: '标签设置',
  steps: {
    general: {
      title: '通用配置',
      uiSchema: {
        alert: {
          type: 'void',
          'x-component': MyAlert, // 使用自定义组件
        },
        children: {
          type: 'string',
          title: '标签名',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      defaultParams: {},
      // 步骤处理函数，设置模型属性
      handler(ctx, params) {
        ctx.model.setProps({ ...params });
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
    const model = this.flowEngine.createModel({
      uid: 'my-model',
      use: 'MyModel',
      stepParams: {
        buttonSettings: {
          general: {
            children: 'My Tag',
            color: '#1890ff',
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
