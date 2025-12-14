import { Application, Plugin } from '@nocobase/client';
import { defineFlow, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Space, Typography } from 'antd';
import React from 'react';

class DemoModel extends FlowModel {
  render() {
    const title = (this.props as any).title || 'Hover me';
    const lastAction = (this.props as any).lastAction || '-';

    return (
      <div style={{ padding: 16 }}>
        <Space direction="vertical">
          <Typography.Text type="secondary">
            悬浮本区域右上角 Flow Settings 图标，打开菜单，在 “Common actions” 中可看到插件扩展项。
          </Typography.Text>
          <Button type="primary">{title}</Button>
          <Typography.Text>lastAction: {lastAction}</Typography.Text>
        </Space>
      </div>
    );
  }
}

const flow = defineFlow({
  key: 'demo',
  title: 'Demo settings',
  steps: {
    basic: {
      title: 'Basic',
      uiSchema: {
        title: {
          type: 'string',
          title: '按钮标题',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      handler(ctx, params) {
        ctx.model.setProps('title', params.title);
      },
    },
  },
});

DemoModel.registerFlow(flow);

// 模拟“插件注入”：为指定 Model 类扩展 settings 菜单项
DemoModel.registerExtraMenuItems({
  group: 'common-actions',
  sort: -10,
  items: (model) => [
    {
      key: 'extra-set-last-action',
      label: 'Extra: 记录一次点击',
      onClick: () => {
        model.setProps('lastAction', `clicked at ${new Date().toLocaleTimeString()}`);
      },
    },
    {
      key: 'extra-reset',
      label: 'Extra: 重置标题',
      onClick: () => {
        model.setProps({
          title: 'Hover me',
          lastAction: `reset at ${new Date().toLocaleTimeString()}`,
        });
      },
    },
  ],
});

class PluginDemo extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ DemoModel });

    const model = this.flowEngine.createModel<DemoModel>({
      uid: 'demo',
      use: 'DemoModel',
      stepParams: { demo: { basic: { title: 'Hover me' } } },
      props: { title: 'Hover me' },
    });

    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} showFlowSettings={{ showBorder: true, showBackground: true }} />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginDemo],
});

export default app.getRootComponent();

