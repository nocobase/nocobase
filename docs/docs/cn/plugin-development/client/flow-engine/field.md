---
title: "字段扩展"
description: "NocoBase 字段扩展开发：FieldModel、ClickableFieldModel 基类、字段渲染、绑定字段接口。"
keywords: "字段扩展,Field,FieldModel,ClickableFieldModel,renderComponent,bindModelToInterface,NocoBase"
---

# 字段扩展

在 NocoBase 中，**字段组件（Field）** 用于表格和表单中展示和编辑数据。通过继承 FieldModel 相关基类，你可以自定义字段的渲染方式——比如用特殊格式展示某种数据，或者用自定义组件来编辑。

## 示例：自定义展示字段

以下示例创建了一个简单的展示字段——在字段值两侧加上方括号 `[]`：

![20260407201138](https://static-docs.nocobase.com/20260407201138.png)

```tsx
// models/SimpleFieldModel.tsx
import React from 'react';
import { ClickableFieldModel } from '@nocobase/client-v2';
import { DisplayItemModel } from '@nocobase/flow-engine';

export class DisplaySimpleFieldModel extends ClickableFieldModel {
  public renderComponent(value) {
    // this.context.record 可以拿到当前行的完整记录
    console.log('当前记录：', this.context.record);
    console.log('当前记录 index：', this.context.recordIndex);
    return <span>[{value}]</span>;
  }
}

// 绑定到 'input' 类型的字段接口
DisplayItemModel.bindModelToInterface('DisplaySimpleFieldModel', ['input']);
```

几个关键点：

- **`renderComponent(value)`** — 接收当前字段的值作为参数，返回渲染的 JSX
- **`this.context.record`** — 获取当前行的完整数据记录
- **`this.context.recordIndex`** — 获取当前行的索引
- **`ClickableFieldModel`** — 继承自 `FieldModel`，带有点击交互能力
- **`DisplayItemModel.bindModelToInterface()`** — 把字段模型绑定到指定的字段接口类型（比如 `input` 表示文本输入类字段），这样在对应类型的字段上就能选择这个展示组件

## 注册字段

在 Plugin 的 `load()` 中用 `registerModelLoaders` 按需加载注册：

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginFieldSimpleClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      DisplaySimpleFieldModel: {
        loader: () => import('./models/SimpleFieldModel'),
      },
    });
  }
}
```

注册完成后，在表格区块里找到一个对应类型的字段列（比如上面示例绑定了 `input`，对应单行文本字段），点击列的配置按钮，在「字段组件」下拉菜单中就能切换到这个自定义展示组件。完整的实战示例见 [做一个自定义字段组件](../examples/custom-field)。

![20260407201221](https://static-docs.nocobase.com/20260407201221.png)

## 完整源码

- [@nocobase-example/plugin-field-simple](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-field-simple) — 自定义字段组件示例

## 相关链接

- [插件实战：做一个自定义字段组件](../examples/custom-field) — 从零搭建一个自定义字段展示组件
- [插件实战：做一个前后端联动的数据管理插件](../examples/fullstack-plugin) — 自定义字段在完整插件中的实际应用
- [FlowEngine 概述](../flow-engine/index.md) — FlowModel 基础用法
- [区块扩展](./block) — 自定义区块
- [操作扩展](./action) — 自定义操作按钮
- [FlowDefinition 流定义](../../../flow-engine/definitions/flow-definition.md) — registerFlow 的完整参数和事件类型
- [FlowEngine 完整文档](../../../flow-engine/index.md) — 完整参考
