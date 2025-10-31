import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Card } from 'antd';
import React from 'react';

class HelloModel extends FlowModel {
  #markdownIt;
  async parseMarkdown(text: string) {
    if (!this.#markdownIt) {
      const MarkdownIt = (await import('markdown-it')).default;
      this.#markdownIt = new MarkdownIt();
    }
    return this.#markdownIt.render(text);
  }
  render() {
    return (
      <Card {...this.props}>
        <div
          dangerouslySetInnerHTML={{
            __html: this.props.children,
          }}
        />
      </Card>
    );
  }
}

HelloModel.registerFlow({
  key: 'cardSettings',
  title: '卡片设置',
  steps: {
    setProps: {
      title: '通用属性',
      uiSchema: {
        title: {
          title: 'Card Title',
          'x-component': 'Input',
          'x-decorator': 'FormItem',
        },
        children: {
          title: 'Card Content',
          'x-component': 'Input.TextArea',
          'x-decorator': 'FormItem',
        },
      },
      defaultParams: {
        title: 'Hello, NocoBase!',
        children: 'This is a **simple card** rendered by **HelloModel**.',
      },
      async handler(ctx, params) {
        ctx.model.setProps({
          title: params.title,
          children: await ctx.model.parseMarkdown(params.children),
        });
      },
    },
  },
});

class PluginHelloModel extends Plugin {
  async load() {
    // 用于测试，强制启用 flowSettings
    this.flowEngine.flowSettings.forceEnable();
    // 注册 HelloModel 到 flowEngine
    this.flowEngine.registerModels({ HelloModel });

    // 创建 HelloModel 的实例（仅用于示例）
    const model = this.flowEngine.createModel({
      use: 'HelloModel',
    });

    // 添加路由，将模型渲染到根路径（仅用于示例）
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} showFlowSettings />,
    });
  }
}

// 创建应用实例，注册插件（仅用于示例）
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
