import { Application, Plugin } from '@nocobase/client';
import { AddSubModelButton, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Card, Input, Space } from 'antd';
import React from 'react';

class StaticModel extends FlowModel {
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
            { key: 'sub1', useModel: 'StaticSubModel', label: 'Sub Model 1' },
            { key: 'sub2', useModel: 'StaticSubModel', label: 'Sub Model 2' },
          ]}
        >
          <Button type="primary">Add Sub Model</Button>
        </AddSubModelButton>
      </Space>
    );
  }
}

class StaticSubModel extends FlowModel {
  render() {
    const descriptionParams = this.getStepParams?.('staticFlow', 'description') || {};
    return (
      <Card title={`Static SubModel - ${this.props.name || '未命名'}`}>
        <p>描述（静态显示步骤）：{descriptionParams.description || '（点击设置按钮输入描述）'}</p>
        <p>名称步骤使用 hideInSettings: true，仅创建时显示。</p>
      </Card>
    );
  }
}

StaticSubModel.registerFlow({
  key: 'staticFlow',
  steps: {
    name: {
      title: '名称',
      hideInSettings: true,
      preset: true,
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
    description: {
      title: '描述',
      hideInSettings: false,
      uiSchema: {
        description: {
          type: 'string',
          title: '描述',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      handler(ctx, params) {
        ctx.model.setStepParams?.('staticFlow', 'description', params);
      },
    },
  },
});

class PluginStaticModel extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ StaticModel, StaticSubModel });

    const model = this.flowEngine.createModel({
      use: 'StaticModel',
      uid: 'static-model',
    });

    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginStaticModel],
});

export default app.getRootComponent();
