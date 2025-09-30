/**
 * defaultShowCode: true
 * title: 模型 cleanRun：每次自动流干净运行
 */

import React from 'react';
import { Application, Plugin } from '@nocobase/client';
import { Card, Space } from 'antd';
import { FlowModel, FlowModelRenderer, defineFlow, escapeT } from '@nocobase/flow-engine';

class DemoModel extends FlowModel {
  static {
    // 配置流：修改卡片标题（演示可配置项）
    this.registerFlow(
      defineFlow({
        key: 'demoSettings',
        title: escapeT('Demo settings'),
        manual: true,
        steps: {
          title: {
            title: escapeT('Title'),
            uiSchema: {
              title: {
                'x-component': 'Input',
                'x-decorator': 'FormItem',
                'x-component-props': { placeholder: escapeT('Please input title') },
              },
            },
            defaultParams: (ctx) => ({ title: (ctx.model.getProps() as any).title ?? '' }),
            handler: (ctx, params) => {
              ctx.model.setProps({ title: params.title });
            },
          },
        },
      }),
    );

    // 自动流：每次运行把 count + 1，并记录 runId
    this.registerFlow(
      defineFlow({
        key: 'autoCounter',
        title: 'Auto counter',
        steps: {
          bumpCount: {
            handler: (ctx) => {
              const props = ctx.model.getProps() as any;
              const prev = Number(props.count) || 0;
              ctx.model.setProps({ count: prev + 1, lastRunId: ctx.runId });
            },
          },
        },
      }),
    );
  }

  render() {
    const { count = 0, lastRunId, title } = this.getProps() as any;
    return (
      <Card size="small" style={{ width: 360 }}>
        <div>
          title: <b>{title || 'Demo'}</b>
        </div>
        <div>
          count: <b>{count}</b>
        </div>
        <div style={{ wordBreak: 'break-all' }}>
          lastRunId: <code>{String(lastRunId || '')}</code>
        </div>
      </Card>
    );
  }
}

class PluginDemo extends Plugin {
  async load() {
    this.flowEngine.registerModels({ DemoModel });
    // 强制启用 FlowSettings（本示例已不依赖设置面板，保留无害）
    this.flowEngine.flowSettings.forceEnable();

    const model1 = this.flowEngine.createModel({ use: 'DemoModel', cleanRun: false });
    const model2 = this.flowEngine.createModel({ use: 'DemoModel', cleanRun: true });

    const View = () => {
      return (
        <Space direction="vertical" size={16}>
          <Space align="start">
            <Space direction="vertical">
              <div>cleanRun: false（状态累加）</div>
              <FlowModelRenderer model={model1} showFlowSettings />
            </Space>
            <Space direction="vertical">
              <div>cleanRun: true（每次干净基线）</div>
              <FlowModelRenderer model={model2} showFlowSettings />
            </Space>
          </Space>
        </Space>
      );
    };

    this.router.add('root', {
      path: '/',
      element: <View />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginDemo],
});

export default app.getRootComponent();
