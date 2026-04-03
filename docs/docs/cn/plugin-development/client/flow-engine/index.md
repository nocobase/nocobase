---
title: "FlowEngine 概述"
description: "NocoBase FlowEngine 插件开发指南：FlowModel 基础用法、renderComponent、registerFlow、uiSchema 配置、基类选择。"
keywords: "FlowEngine,FlowModel,BlockModel,registerFlow,uiSchema,renderComponent,NocoBase"
---

# FlowEngine

在 NocoBase 中，**FlowEngine（流引擎）** 是驱动可视化配置的核心引擎。NocoBase 界面上的区块、字段、操作按钮，都是通过 FlowEngine 来管理的——包括它们的渲染、配置面板、以及配置的持久化。

![20260403215904](https://static-docs.nocobase.com/20260403215904.png)

对于插件开发者来说，FlowEngine 提供了两个核心概念：

- **FlowModel** — 可配置的组件模型，负责渲染 UI 和管理 props
- **Flow** — 配置流程，定义组件的配置面板和数据处理逻辑

如果你的组件需要出现在「添加区块 / 字段 / 操作」菜单里，或者需要支持用户在界面上进行可视化配置，就需要用 FlowModel 来包装。如果不需要这些能力，用普通 React 组件就够了——见 [Component vs FlowModel](../component-vs-flow-model)。

## FlowModel 是什么

跟普通 React 组件不同，FlowModel 除了负责渲染 UI，还管理着 props 的来源、配置面板的定义、以及配置持久化。简单来说：普通组件的 props 是写死的，FlowModel 的 props 是通过 Flow 动态生成的。

想深入了解 FlowEngine 的整体架构，可以看 [FlowEngine 文档](/flow-engine)。下面从插件开发者的角度，介绍怎么用。

## 最小示例

一个 FlowModel 从创建到注册，分三步：

### 1. 继承基类，实现 renderComponent

```tsx
// models/HelloBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';

export class HelloBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h3>Hello FlowEngine!</h3>
        <p>这是一个自定义区块。</p>
      </div>
    );
  }
}

// define() 设置菜单里的显示名
HelloBlockModel.define({
  label: tExpr('Hello block'),
});
```

`renderComponent()` 就是这个模型的渲染方法，类似 React 组件的 `render()`。`tExpr()` 用于延迟翻译——因为 `define()` 在模块加载时就执行了，此时 i18n 还没初始化。详见 [Context 常用能力 → tExpr](../ctx/common-capabilities#texpr)。

### 2. 在 Plugin 里注册

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class MyPlugin extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      HelloBlockModel: {
        // 按需加载，首次用到时才加载模块
        loader: () => import('./models/HelloBlockModel'),
      },
    });
  }
}
```

### 3. 在界面上使用

注册完成后，通过启动插件之后(启用插件可以参考[插件开发概述](../../index.md))，在 NocoBase 界面新建页面，点击「添加区块」就能看到你的「Hello block」了。

![20260403221815](https://static-docs.nocobase.com/20260403221815.png)

## 用 registerFlow 添加配置项

光能渲染还不够——FlowModel 的核心价值在于**可配置**。通过 `registerFlow()` 可以给模型添加配置面板，让用户在界面上修改属性。

比如一个支持编辑 HTML 内容的区块：

```tsx
// models/SimpleBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    // this.props 的值来自 Flow handler 的设置
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender', // 渲染前执行
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      // uiSchema 定义配置面板的 UI
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      // 默认值
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      // handler 里把配置面板的值设置到 model 的 props 上
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

这里面几个关键点：

- **`on: 'beforeRender'`** — 表示这个 Flow 在渲染前执行，配置面板的值会在渲染前写入 `this.props`
- **`uiSchema`** — 用 [Formily](https://formilyjs.org/) 的 JSON Schema 格式定义配置面板的 UI
- **`handler(ctx, params)`** — `params` 是用户在配置面板填写的值，通过 `ctx.model.props` 设置到模型上
- **`defaultParams`** — 配置面板的默认值

## uiSchema 常用写法

`uiSchema` 基于 Formily JSON Schema，这里列出最常用的几种组件：

```ts
uiSchema: {
  // 文本输入
  title: {
    type: 'string',
    title: '标题',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
  // 多行文本
  content: {
    type: 'string',
    title: '内容',
    'x-decorator': 'FormItem',
    'x-component': 'Input.TextArea',
  },
  // 下拉选择
  type: {
    type: 'string',
    title: '类型',
    'x-decorator': 'FormItem',
    'x-component': 'Select',
    enum: [
      { label: '主要', value: 'primary' },
      { label: '默认', value: 'default' },
      { label: '虚线', value: 'dashed' },
    ],
  },
  // 开关
  bordered: {
    type: 'boolean',
    title: '显示边框',
    'x-decorator': 'FormItem',
    'x-component': 'Switch',
  },
}
```

每个字段都用 `'x-decorator': 'FormItem'` 包裹，这样会自动带上标题和布局。完整的 uiSchema 参考见 [FlowEngine 文档 → uiSchema](/flow-engine/uischema)。

## FlowModel 基类选择

NocoBase 提供了多个 FlowModel 基类，根据你要扩展的类型选择：

| 基类                   | 用途                     | 详细文档             |
| ---------------------- | ------------------------ | -------------------- |
| `BlockModel`           | 普通区块                 | [区块扩展](./block)  |
| `DataBlockModel`       | 需要自行获取数据的区块   | [区块扩展](./block)  |
| `CollectionBlockModel` | 绑定数据表、自动获取数据 | [区块扩展](./block)  |
| `FieldModel`           | 字段组件                 | [字段扩展](./field)  |
| `ActionModel`          | 操作按钮                 | [操作扩展](./action) |

通常来说，做区块用 `BlockModel` 或 `CollectionBlockModel`，做字段用 `FieldModel`，做操作按钮用 `ActionModel`。

## 相关链接

- [区块扩展](./block) — 用 BlockModel 系列基类开发区块
- [字段扩展](./field) — 用 FieldModel 开发自定义字段
- [操作扩展](./action) — 用 ActionModel 开发操作按钮
- [Component vs FlowModel](../component-vs-flow-model) — 不确定该用哪种方式？
- [FlowEngine 文档](/flow-engine) — FlowModel、Flow、Context 的完整参考
- [FlowEngine 快速开始](/flow-engine/quickstart) — 从零构建一个可编排的按钮组件
