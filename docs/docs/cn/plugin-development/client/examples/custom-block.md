---
title: "做一个自定义展示区块"
description: "NocoBase 插件实战：用 BlockModel + registerFlow + uiSchema 做一个可配置的 HTML 展示区块。"
keywords: "自定义区块,BlockModel,registerFlow,uiSchema,renderComponent,NocoBase"
---

# 做一个自定义展示区块

在 NocoBase 中，区块是页面上的内容区域。这个示例展示怎么用 `BlockModel` 做一个最简单的自定义区块——支持在界面上编辑 HTML 内容，用户可以通过配置面板修改区块显示的内容。

这是第一个涉及 FlowEngine 的示例，会用到 `BlockModel`、`renderComponent`、`registerFlow` 和 `uiSchema`。

:::tip 前置阅读

建议先了解以下内容，开发时会更顺畅：

- [编写第一个插件](../../write-your-first-plugin) — 插件创建和目录结构
- [Plugin 插件](../plugin) — 插件入口和 `load()` 生命周期
- [FlowEngine 概述](../flow-engine/index.md) — FlowModel、renderComponent、registerFlow 基础用法
- [i18n 国际化](../component/i18n) — 翻译文件写法和 `tExpr()` 延迟翻译的用法

:::

## 最终效果

我们要做的是一个「Simple block」区块：

- 出现在「添加区块」菜单里
- 渲染用户配置的 HTML 内容
- 通过配置面板（registerFlow + uiSchema）让用户编辑 HTML

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_17.23.49.mp4" type="video/mp4">
</video>

完整源码见 [@nocobase-example/plugin-simple-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block)。如果你想直接在本地跑起来看效果：

```bash
yarn pm enable @nocobase-example/plugin-simple-block
```

下面从零开始，一步步搭建这个插件。

## 第一步：创建插件骨架

在仓库根目录执行：

```bash
yarn pm create @my-project/plugin-simple-block
```

这会在 `packages/plugins/@my-project/plugin-simple-block` 下生成基础文件结构。详细说明见 [编写第一个插件](../../write-your-first-plugin)。

## 第二步：创建区块模型

新建 `src/client-v2/models/SimpleBlockModel.tsx`。这是整个插件的核心——定义区块怎么渲染、怎么配置。

```tsx
// src/client-v2/models/SimpleBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '../locale';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

// 设置区块在「添加区块」菜单里的显示名
SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

// 注册配置面板，让用户可以编辑 HTML 内容
SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender', // 渲染前执行
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      // uiSchema 定义配置面板的表单 UI
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      // 配置面板的默认值
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      // 把配置面板的值写入 model 的 props
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

几个关键点：

- **`renderComponent()`** — 渲染区块 UI，通过 `this.props.html` 读取 HTML 内容
- **`define()`** — 设置区块在「添加区块」菜单里的显示名。`tExpr()` 用于延迟翻译，因为 `define()` 在模块加载时就执行了，此时 i18n 还没初始化
- **`registerFlow()`** — 添加配置面板。`uiSchema` 用 JSON Schema 定义表单（语法参考 [UI Schema](../../../../flow-engine/ui-schema)），`handler` 把用户填写的值写入 `ctx.model.props`，`renderComponent()` 就能读到

## 第三步：添加多语言文件

编辑插件的 `src/locale/` 下的翻译文件，把 `tExpr()` 用到的 key 都加上翻译：

```json
// src/locale/zh-CN.json
{
  "Simple block": "简单区块",
  "Simple Block Flow": "简单区块配置",
  "Edit HTML Content": "编辑 HTML 内容",
  "HTML Content": "HTML 内容"
}
```

```json
// src/locale/en-US.json
{
  "Simple block": "Simple block",
  "Simple Block Flow": "Simple Block Flow",
  "Edit HTML Content": "Edit HTML Content",
  "HTML Content": "HTML Content"
}
```

:::warning 注意

初次添加语言文件需要重启应用才能生效。

:::

关于翻译文件的写法和 `tExpr()` 的更多用法，详见 [i18n 国际化](../component/i18n)。

## 第四步：在插件中注册

编辑 `src/client-v2/plugin.tsx`，用 `registerModelLoaders` 按需加载模型：

```ts
// src/client-v2/plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginSimpleBlockClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      SimpleBlockModel: {
        // 按需加载，首次用到时才加载模块
        loader: () => import('./models/SimpleBlockModel'),
      },
    });
  }
}

export default PluginSimpleBlockClient;
```

`registerModelLoaders` 使用动态导入，模型代码在首次真正用到时才会加载——这是推荐的注册方式。

## 第五步：启用插件

```bash
yarn pm enable @my-project/plugin-simple-block
```

启用后，新建一个页面，点击「添加区块」就能看到「Simple block」。添加后，点击区块的配置按钮可以编辑 HTML 内容。

## 完整源码

- [@nocobase-example/plugin-simple-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block) — 自定义展示区块完整示例

## 小结

这个示例用到的能力：

| 能力     | 用法                               | 文档                                          |
| -------- | ---------------------------------- | --------------------------------------------- |
| 区块渲染 | `BlockModel` + `renderComponent()` | [FlowEngine → 区块扩展](../flow-engine/block) |
| 菜单注册 | `define({ label })`                | [FlowEngine 概述](../flow-engine/index.md)    |
| 配置面板 | `registerFlow()` + `uiSchema`      | [FlowEngine 概述](../flow-engine/index.md)    |
| 模型注册 | `registerModelLoaders`（按需加载） | [Plugin 插件](../plugin)                      |
| 延迟翻译 | `tExpr()`                          | [i18n 国际化](../component/i18n)              |

## 相关链接

- [编写第一个插件](../../write-your-first-plugin) — 从零创建插件骨架
- [FlowEngine 概述](../flow-engine/index.md) — FlowModel 基础用法和 registerFlow
- [FlowEngine → 区块扩展](../flow-engine/block) — BlockModel、DataBlockModel、CollectionBlockModel
- [UI Schema](../../../../flow-engine/ui-schema) — uiSchema 语法参考
- [Component vs FlowModel](../component-vs-flow-model) — 什么时候用 FlowModel
- [Plugin 插件](../plugin) — 插件入口和 load() 生命周期
- [i18n 国际化](../component/i18n) — 翻译文件写法和 tExpr 用法
- [FlowEngine 完整文档](../../../flow-engine/index.md) — FlowModel、Flow、Context 的完整参考
