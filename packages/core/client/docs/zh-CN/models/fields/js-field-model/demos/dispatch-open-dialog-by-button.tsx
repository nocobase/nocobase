/**
 * defaultShowCode: true
 * title: JSFieldModel 点击 → 触发按钮弹窗（dispatchModelEvent）
 */

import React from 'react';
import {
  Application,
  ActionModel,
  FieldModelRenderer,
  JSFieldModel,
  MockFlowModelRepository,
  Plugin,
  PluginFlowEngine,
} from '@nocobase/client';
import { FlowModelRenderer } from '@nocobase/flow-engine';
import { Card, Space } from 'antd';
import { APIClient } from '@nocobase/sdk';
import MockAdapter from 'axios-mock-adapter';

const bootstrapMock = (api: APIClient) => {
  const mock = new MockAdapter(api.axios);
  // ACL：允许全部，避免 roles:check 触发真实请求
  mock
    .onGet('roles:check')
    .reply(200, { data: { allowAll: true, resources: [], actions: {}, actionAlias: {}, strategy: {} } });
};

// 目标：按钮模型（监听 click 事件，在点击时弹出对话框）
class PopupButtonModel extends ActionModel {
  defaultProps = {
    type: 'primary' as const,
    title: '目标按钮（监听 click 打开弹窗）',
  };
}

PopupButtonModel.registerFlow({
  key: 'button-popup',
  on: 'click',
  steps: {
    open: {
      title: '打开弹窗',
      async handler(ctx) {
        const args = ctx.event?.args || {};
        await ctx.viewer.dialog({
          width: 520,
          content: `
            <div style="padding:16px;font:14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
              <h3 style="margin:0 0 12px;">按钮弹窗</h3>
              <div style="color:#999;margin-bottom:8px;">收到的参数：</div>
              <pre style="background:#f5f5f5;padding:12px;border-radius:6px;">${JSON.stringify(args, null, 2)}</pre>
            </div>
          `,
        });
      },
    },
  },
});

class DemoPlugin extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.setModelRepository(new MockFlowModelRepository('demo-jsfield-dispatch-button:'));
    this.flowEngine.registerModels({ PopupButtonModel });

    // 注入 API 并 mock 必要接口
    const api = new APIClient({ baseURL: 'https://localhost:8000/api' });
    bootstrapMock(api);
    this.flowEngine.context.defineProperty('api', { value: api });

    // 先创建目标按钮，拿到 uid，供源端 JS 脚本调用
    const targetButton = this.flowEngine.createModel({ use: 'PopupButtonModel' }) as PopupButtonModel;
    // 确保可通过 engine.loadModel(uid) 找到：持久化到 MockFlowModelRepository
    await targetButton.save();

    // 触发端：顶层 JSFieldModel（点击链接 -> 分发按钮 click 事件）
    const triggerField = this.flowEngine.createModel({
      use: 'JSFieldModel',
      stepParams: {
        jsSettings: {
          runJs: {
            code: `
ctx.element.innerHTML = '<a href="javascript:;" style="color:#1677ff;">打开按钮弹窗</a>';
ctx.element.querySelector('a')?.addEventListener('click', () => {
  ctx.dispatchModelEvent('${targetButton.uid}', 'click', {
    from: 'JSFieldModel',
    time: new Date().toISOString(),
    note: '通过 dispatchModelEvent 触发按钮的 click 事件',
  });
});
            `.trim(),
          },
        },
      },
    });

    this.router.add('root', {
      path: '/',
      element: (
        <Space direction="vertical" style={{ width: '100%', padding: 16 }} size={16}>
          <Card title="触发端（JSFieldModel 链接）">
            <FieldModelRenderer model={triggerField} showFlowSettings />
          </Card>
          <Card title="目标按钮（监听 click 打开弹窗）">
            <FlowModelRenderer model={targetButton} showFlowSettings />
          </Card>
        </Space>
      ),
    });
  }
}

export default new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginFlowEngine, DemoPlugin],
}).getRootComponent();
