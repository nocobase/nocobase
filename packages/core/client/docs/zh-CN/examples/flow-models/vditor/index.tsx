/**
 * defaultShowCode: true
 * title: Hello World
 */

import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Card } from 'antd';
import React from 'react';

class HelloModel extends FlowModel {
  render() {
    return (
      <Card {...this.props}>
        <div ref={this.context.ref} />
      </Card>
    );
  }
  async onMount() {
    if (!this.context.ref.current) {
      return;
    }
    await this.context.loadCSS('https://cdn.jsdelivr.net/npm/vditor/dist/index.css');
    const Vditor = await this.context.requireAsync('https://cdn.jsdelivr.net/npm/vditor/dist/index.min.js');
    // 初始化 Vditor
    const vditor = new Vditor(this.context.ref.current, {
      height: 400,
      toolbar: [
        'bold',
        'italic',
        'strike',
        'headings',
        '|',
        'quote',
        'list',
        'ordered-list',
        'check',
        '|',
        'link',
        'table',
        'code',
        'inline-code',
        '|',
        'undo',
        'redo',
        '|',
        'preview',
        'fullscreen',
      ],
      cache: {
        enable: false, // 禁用缓存，刷新页面不会保留内容
      },
      // mode: 'sv', // 双视图，编辑+预览
      value: `# Hello Vditor!

- [x] Task 1
- [ ] Task 2

| Name  | Age |
|-------|-----|
| Alice | 24  |
| Bob   | 30  |

> This is a blockquote.
`,
    });
  }
}

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
