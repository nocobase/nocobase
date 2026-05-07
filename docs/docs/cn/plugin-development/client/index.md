---
title: "客户端插件开发概述"
description: "NocoBase 客户端插件开发概述：知识主线 Plugin → Router → Component → Context → FlowEngine，快速索引表帮助定位章节。"
keywords: "客户端插件,Plugin,Router,Component,Context,FlowEngine,FlowModel,NocoBase"
---

# 概述

NocoBase 的客户端插件可以做很多事：注册新页面、写自定义组件、调用后端 API、添加区块和字段，甚至扩展操作按钮。所有这些能力都通过一个统一的插件入口来组织。

如果你已经有 React 开发经验，上手会很快——大部分场景就是写普通的 React 组件，再借助 NocoBase 提供的上下文能力（比如发请求、国际化）来和 NocoBase 对接。只有当你需要让组件出现在 NocoBase 的可视化配置界面里时，才需要了解 [FlowEngine](./flow-engine/index.md)。

:::warning 注意

NocoBase 正在从 `client`（v1）向 `client-v2` 迁移，目前 `client-v2` 还在开发中。本文档介绍的内容供尝鲜体验，不建议直接上生产环境。新开发的插件请使用 `src/client-v2/` 目录和 `@nocobase/client-v2` 的 API。

:::

## 学习路径

建议按以下顺序了解客户端插件开发，从简单到复杂：

```
Plugin（入口）→ Router（页面）→ Component（组件）→ Context（上下文）→ FlowEngine（UI 扩展）
```

其中：

1. **[Plugin](./plugin)**：插件的入口类，在 `load()` 等生命周期里注册路由、模型等资源。
2. **[Router](./router)**：通过 `router.add()` 注册页面路由，通过 `pluginSettingsManager` 注册插件设置页。
3. **[Component](./component/index.md)**：路由挂载的就是 React 组件。默认用 React + Antd 写就行，跟普通前端开发没有区别。
4. **[Context](./ctx/index.md)**：插件里可以通过 `this.context` 拿到上下文，组件里通过 `useFlowContext()` 拿到上下文，就能用 NocoBase 提供的能力——发请求（`ctx.api`）、国际化（`ctx.t`）、日志（`ctx.logger`）等。
5. **[FlowEngine](./flow-engine/index.md)**：如果你的组件需要出现在「添加区块 / 字段 / 操作」菜单里、支持用户可视化配置，就需要用 FlowModel 来包装。

前四步覆盖大多数插件场景。只有需要深度集成 NocoBase UI 配置体系时，才需要走到第五步。不确定该用哪种方式，可以看 [Component vs FlowModel](./component-vs-flow-model)。

## 快速索引

| 我想要……                             | 去哪里看                                                |
| ------------------------------------ | ------------------------------------------------------- |
| 了解客户端插件基本结构               | [Plugin 插件](./plugin)                                 |
| 添加一个独立页面                     | [Router 路由](./router)                                 |
| 添加一个插件设置页                   | [Router 路由](./router)                                 |
| 写一个普通 React 组件                | [Component 组件开发](./component/index.md)                       |
| 调用后端 API、使用 NocoBase 内置能力 | [Context → 常用能力](./ctx/common-capabilities)         |
| 自定义组件样式                       | [Styles & Themes 样式与主题](./component/styles-themes) |
| 添加一个新的区块                     | [FlowEngine → 区块扩展](./flow-engine/block)            |
| 添加一个新的字段组件                 | [FlowEngine → 字段扩展](./flow-engine/field)            |
| 添加一个新的操作按钮                 | [FlowEngine → 操作扩展](./flow-engine/action)           |
| 不确定用 Component 还是 FlowModel    | [Component vs FlowModel](./component-vs-flow-model)     |
| 看一个完整的插件是怎么做的           | [插件实战示例](./examples/index.md)                              |

## 相关链接

- [编写第一个插件](../write-your-first-plugin) — 从零创建一个可运行的插件
- [服务端开发概述](../server) — 客户端插件通常需要配合服务端
- [FlowEngine 完整文档](../../flow-engine/index.md) — FlowModel、Flow、Context 的完整参考
- [项目目录结构](../project-structure) — 插件文件放在哪里
