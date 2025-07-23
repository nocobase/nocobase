import { generate, green, presetPalettes, red } from '@ant-design/colors';
import { connect } from '@formily/react';
import { Application, Plugin } from '@nocobase/client';
import { defineFlow, FlowModel, FlowModelRenderer, useFlowSettingsContext } from '@nocobase/flow-engine';
import type { ColorPickerProps } from 'antd';
import { ColorPicker as AntdColorPicker, Button, Tag, theme } from 'antd';
import React from 'react';

// 自定义模型类，继承自 FlowModel
class MyModel extends FlowModel {
  render() {
    return <Tag {...this.props} />;
  }
}

type Presets = Required<ColorPickerProps>['presets'][number];

function genPresets(presets = presetPalettes) {
  return Object.entries(presets).map<Presets>(([label, colors]) => ({ label, colors, key: label }));
}

const ColorPicker = connect(({ onChange, ...rest }) => {
  const { token } = theme.useToken();
  const presets = genPresets({ primary: generate(token.colorPrimary), red, green });

  return (
    <AntdColorPicker
      presets={presets}
      onChange={(_, css) => {
        onChange(css); // 将颜色值传递给 onChange
      }}
      {...rest}
    />
  );
});

const buttonSettings = defineFlow({
  key: 'buttonSettings',
  title: '标签设置',
  steps: {
    general: {
      title: '通用配置',
      uiSchema: {
        children: {
          type: 'string',
          title: '标签名',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        color: {
          type: 'string',
          title: '标签颜色',
          'x-decorator': 'FormItem',
          'x-component': 'ColorPicker',
          'x-component-props': {
            showText: true,
            format: 'hex',
          },
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
    this.flowEngine.flowSettings.registerComponents({ ColorPicker });
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
