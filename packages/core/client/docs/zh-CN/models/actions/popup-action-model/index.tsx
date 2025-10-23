import React from 'react';
import { Application, Plugin, PopupActionModel, PluginFlowEngine, MockFlowModelRepository } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import MockAdapter from 'axios-mock-adapter';
import { Button, Space, Typography } from 'antd';

// 弹窗页面模型：用于展示自定义上下文内容
class DemoPopupPageModel extends FlowModel {
  render() {
    const token = this.context.themeToken;
    const boxStyle: React.CSSProperties = {
      padding: 16,
      margin: 16,
      background: token.colorBgContainer,
      border: `1px solid ${token.colorBorder}`,
      borderRadius: token.borderRadius,
    };
    return (
      <div style={boxStyle}>
        <Typography.Title level={5} style={{ marginTop: 0 }}>
          演示：透传自定义上下文
        </Typography.Title>
        <div style={{ marginBottom: 8 }}>myToken: {String(this.context.myToken)}</div>
        <div style={{ marginBottom: 12 }}>extraInfo: {JSON.stringify(this.context.extraInfo)}</div>
        <Space>
          <Button
            onClick={() => {
              this.context.message?.success?.('调用了自定义方法');
              this.context.greet?.('NocoBase');
            }}
          >
            调用自定义方法
          </Button>
          <Button onClick={() => this.context.view?.close?.()}>关闭</Button>
        </Space>
      </div>
    );
  }
}

// 继承 PopupActionModel：通过 getInputArgs 透传自定义上下文
class CustomCtxPopupActionModel extends PopupActionModel {
  defaultProps = {
    title: '打开带上下文的弹窗',
    type: 'primary' as const,
  };

  getInputArgs() {
    const base = super.getInputArgs?.() || {};
    return {
      ...base,
      mode: 'dialog',
      size: 'medium',
      pageModelClass: 'DemoPopupPageModel',
      // 自定义属性：在子页面通过 ctx.myToken / ctx.extraInfo 读取
      defineProperties: {
        myToken: { get: () => this.context.user?.id ?? 'anonymous' },
        extraInfo: { value: { from: 'parent', at: Date.now() } },
      },
      // 自定义方法：在子页面通过 ctx.greet() 调用
      defineMethods: {
        greet: (name: string) => {
          this.context.message?.info?.(`Hello, ${name}!`);
        },
      },
    };
  }
}

// 根页面模型：渲染一个按钮，点击后打开弹窗
class DemoRootActionPageModel extends FlowModel {
  render() {
    const btn = this.subModels?.btn as FlowModel | undefined;
    return (
      <div style={{ padding: 24 }}>
        <Typography.Title level={4}>PopupActionModel - 自定义上下文示例</Typography.Title>
        {btn ? <FlowModelRenderer model={btn} /> : null}
      </div>
    );
  }
}

class DemoPlugin extends Plugin {
  async load() {
    // 注册模型
    this.flowEngine.registerModels({ DemoPopupPageModel, CustomCtxPopupActionModel, DemoRootActionPageModel });

    // 使用本地 Mock 仓库，避免依赖后端接口，并清理旧数据避免历史配置干扰
    const repo = new MockFlowModelRepository('demo-popup-action:');
    await repo.clear();
    this.flowEngine.setModelRepository(repo);

    // 创建根页面模型与子按钮模型
    const root = this.flowEngine.createModel({
      use: 'DemoRootActionPageModel',
      subModels: {
        btn: { use: 'CustomCtxPopupActionModel' },
      },
    });

    // 挂到路由（仅用于示例）
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={root} />,
    });
  }
}

// 启动示例应用
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  // 提供 baseURL，避免 axios 解析诸如 'roles:check' 时出现 Unsupported protocol 错误
  apiClient: { baseURL: 'http://localhost:8000' },
  plugins: [PluginFlowEngine, DemoPlugin],
});

// Mock 必要接口，避免 ACL/角色等请求导致报错
const mock = new MockAdapter(app.apiClient.axios);
mock.onGet('roles:check').reply(200, { data: { allowAll: true } });

export default app.getRootComponent();
