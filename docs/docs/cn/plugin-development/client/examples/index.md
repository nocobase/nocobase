---
title: "插件实战示例"
description: "NocoBase 客户端插件完整实战案例：设置页、自定义区块、前后端联动、自定义字段，从零到完成的完整插件。"
keywords: "插件示例,实战案例,完整插件,NocoBase"
---

# 插件实战示例

前面的章节分别介绍了 [Plugin](../plugin)、[Router](../router)、[Component](../component/index.md)、[Context](../ctx/index.md)、[FlowEngine](../flow-engine/index.md) 等各项能力。这个章节把它们串起来——通过几个完整的实战示例，展示一个插件从创建到完成的全过程。

每个示例都对应一个可运行的示例插件，你可以直接查看源码或在本地跑起来。

## 示例列表

| 示例 | 涉及能力 | 难度 |
| --- | --- | --- |
| [做一个插件设置页](./settings-page) | Plugin + Router + Component + Context + 服务端 | 入门 |
| [做一个自定义展示区块](./custom-block) | Plugin + FlowEngine（BlockModel） | 入门 |
| [做一个自定义字段组件](./custom-field) | Plugin + FlowEngine（FieldModel） | 入门 |
| [做一个自定义操作按钮](./custom-action) | Plugin + FlowEngine（ActionModel） | 入门 |
| [做一个前后端联动的数据管理插件](./fullstack-plugin) | Plugin + FlowEngine（TableBlockModel + FieldModel + ActionModel）+ 服务端 | 进阶 |

建议按顺序阅读。第一个示例用 React 组件 + 简单的服务端接口，不涉及 FlowEngine；中间三个分别演示 FlowEngine 的区块、字段、操作三种基类；最后一个把前面学到的区块、字段、操作串在一起，加上服务端数据表，组成一个完整的前后端联动插件。如果你还不确定该用 React 组件还是 FlowModel，可以先看 [Component vs FlowModel](../component-vs-flow-model)。

## 相关链接

- [编写第一个插件](../../write-your-first-plugin) — 从零创建一个可运行的插件
- [客户端开发概述](../index.md) — 学习路径和快速索引
- [FlowEngine 概述](../flow-engine/index.md) — FlowModel 基础用法和 registerFlow
- [FlowEngine 完整文档](../../../flow-engine/index.md) — FlowModel、Flow、Context 的完整参考
- [Component vs FlowModel](../component-vs-flow-model) — 选择组件还是 FlowModel
