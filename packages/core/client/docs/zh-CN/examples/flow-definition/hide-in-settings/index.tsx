import { Application, Plugin } from '@nocobase/client';
import { AddSubModelButton, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Card, Input, Space } from 'antd';
import React from 'react';

class HelloModel extends FlowModel {
  render() {
    return (
      <Space direction="vertical">
        {this.mapSubModels('subs', (subModel) => (
          <FlowModelRenderer key={subModel.uid} model={subModel} showFlowSettings />
        ))}
        <AddSubModelButton
          model={this}
          subModelKey="subs"
          items={[
            {
              key: 'sub1',
              useModel: 'HelloSubModel',
              label: 'Sub Model 1',
            },
            {
              key: 'sub2',
              useModel: 'HelloSubModel',
              label: 'Sub Model 2',
            },
          ]}
        >
          <Button type="primary">Add Sub Model</Button>
        </AddSubModelButton>
      </Space>
    );
  }
}

class HelloSubModel extends FlowModel {
  render() {
    const displayParams = this.getStepParams?.('helloSubModelSettings', 'display') || {};
    const extraParams = this.getStepParams?.('helloSubModelSettings', 'extra') || {};

    return (
      <Card title={`Hello SubModel - ${this.props.name}`}>
        <p>This is a sub-model rendered by HelloSubModel.</p>
        <p>额外配置开关：{displayParams.enableExtra ? '已开启' : '未开启'}</p>
        {displayParams.enableExtra ? <p>额外提示：{extraParams.tip || '（未填写）'}</p> : null}
      </Card>
    );
  }
}

HelloSubModel.registerFlow({
  key: 'helloSubModelSettings',
  steps: {
    name: {
      title: '名称',
      hideInSettings: true,
      preset: true, // 创建子模型时必须填写该步骤参数
      uiSchema: {
        name: {
          type: 'string',
          title: '名称',
          required: true,
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      handler(ctx, params) {
        ctx.model.setProps({ name: params.name });
      },
    },
    display: {
      title: '显示选项',
      hideInSettings: false,
      defaultParams: {
        enableExtra: false,
      },
      uiSchema: {
        enableExtra: {
          type: 'boolean',
          title: '开启额外配置',
          'x-decorator': 'FormItem',
          'x-component': 'Switch',
        },
      },
      handler(ctx, params) {
        ctx.model.setStepParams?.('helloSubModelSettings', 'display', params);
      },
    },
    extra: {
      title: '额外配置',
      hideInSettings: (ctx) => !ctx.getStepParams('display')?.enableExtra,
      defaultParams: {
        tip: '只有在开启“显示选项”后才会看到本配置项',
      },
      uiSchema: {
        tip: {
          type: 'string',
          title: '提示文案',
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      handler(ctx, params) {
        ctx.model.setStepParams?.('helloSubModelSettings', 'extra', params);
      },
    },
  },
});

class PluginHelloModel extends Plugin {
  async load() {
    // 注册 HelloModel 到 flowEngine
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ HelloModel, HelloSubModel });
    // 添加路由，将模型渲染到根路径（仅用于示例）
    const model = this.flowEngine.createModel({
      use: 'HelloModel',
      uid: 'hello1',
    });
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

// 创建应用实例，注册插件（仅用于示例）
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
