---
title: "做一个自定义字段组件"
description: "NocoBase 插件实战：用 ClickableFieldModel 做一个自定义字段展示组件，绑定到字段接口。"
keywords: "自定义字段,FieldModel,ClickableFieldModel,bindModelToInterface,字段扩展,NocoBase"
---

# 做一个自定义字段组件

在 NocoBase 中，字段组件用于表格和表单中展示和编辑数据。这个示例展示怎么用 `ClickableFieldModel` 做一个自定义的字段展示组件——在字段值两侧加上方括号 `[]`，并绑定到 `input` 类型的字段接口上。

:::tip 前置阅读

建议先了解以下内容，开发时会更顺畅：

- [编写第一个插件](../../write-your-first-plugin) — 插件创建和目录结构
- [Plugin 插件](../plugin) — 插件入口和 `load()` 生命周期
- [FlowEngine 概述](../flow-engine/index.md) — FlowModel 基础用法
- [FlowEngine → 字段扩展](../flow-engine/field) — FieldModel、ClickableFieldModel 基类介绍
- [i18n 国际化](../component/i18n) — 翻译文件写法和 `tExpr()` 延迟翻译的用法

:::

## 最终效果

我们要做的是一个自定义字段展示组件：

- 继承 `ClickableFieldModel`，自定义渲染逻辑
- 在字段值两侧加上 `[]` 显示
- 通过 `bindModelToInterface` 绑定到 `input`（单行文本）类型的字段

启用插件后，在表格区块里找到一个单行文本字段的列，点击列的配置按钮，在「字段组件」下拉菜单中就能看到 `DisplaySimpleFieldModel` 选项。切换过去后，该列的值会以 `[value]` 格式显示。

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_20.08.48.mp4" type="video/mp4">
</video>

完整源码见 [@nocobase-example/plugin-field-simple](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-field-simple)。如果你想直接在本地跑起来看效果：

```bash
yarn pm enable @nocobase-example/plugin-field-simple
```

下面从零开始，一步步搭建这个插件。

## 第一步：创建插件骨架

在仓库根目录执行：

```bash
yarn pm create @my-project/plugin-field-simple
```

详细说明见 [编写第一个插件](../../write-your-first-plugin)。

## 第二步：创建字段模型

新建 `src/client-v2/models/DisplaySimpleFieldModel.tsx`。这是插件的核心——定义字段怎么渲染，以及绑定到哪种字段接口。

```tsx
// src/client-v2/models/DisplaySimpleFieldModel.tsx
import React from 'react';
import { ClickableFieldModel } from '@nocobase/client-v2';
import { DisplayItemModel } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class DisplaySimpleFieldModel extends ClickableFieldModel {
  public renderComponent(value: string) {
    // this.context.record 可以拿到当前行的完整记录
    console.log('当前记录：', this.context.record);
    console.log('当前记录 index：', this.context.recordIndex);
    return <span>[{value}]</span>;
  }
}

// 设置在「字段组件」下拉菜单里的显示名
DisplaySimpleFieldModel.define({
  label: tExpr('Simple field'),
});

// 绑定到 'input'（单行文本）类型的字段接口
DisplayItemModel.bindModelToInterface('DisplaySimpleFieldModel', ['input']);
```

几个关键点：

- **`renderComponent(value)`** — 接收当前字段的值作为参数，返回渲染的 JSX
- **`this.context.record`** — 获取当前行的完整数据记录
- **`this.context.recordIndex`** — 获取当前行的索引
- **`ClickableFieldModel`** — 继承自 `FieldModel`，带有点击交互能力
- **`define({ label })`** — 设置在「字段组件」下拉菜单里的显示名，不加的话会直接显示类名
- **`DisplayItemModel.bindModelToInterface()`** — 把字段模型绑定到指定的字段接口类型（比如 `input` 表示单行文本字段），这样在对应类型的字段上就能选择这个展示组件

## 第三步：添加多语言文件

编辑插件的 `src/locale/` 下的翻译文件，把 `tExpr()` 用到的 key 加上翻译：

```json
// src/locale/zh-CN.json
{
  "Simple field": "简单字段"
}
```

```json
// src/locale/en-US.json
{
  "Simple field": "Simple field"
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

export class PluginFieldSimpleClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      DisplaySimpleFieldModel: {
        loader: () => import('./models/DisplaySimpleFieldModel'),
      },
    });
  }
}

export default PluginFieldSimpleClient;
```

## 第五步：启用插件

```bash
yarn pm enable @my-project/plugin-field-simple
```

启用后，在表格区块里找到一个单行文本字段的列，点击列的配置按钮，在「字段组件」下拉菜单中就能切换到这个自定义展示组件。

## 完整源码

- [@nocobase-example/plugin-field-simple](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-field-simple) — 自定义字段组件完整示例

## 小结

这个示例用到的能力：

| 能力         | 用法                                             | 文档                                          |
| ------------ | ------------------------------------------------ | --------------------------------------------- |
| 字段渲染     | `ClickableFieldModel` + `renderComponent(value)` | [FlowEngine → 字段扩展](../flow-engine/field) |
| 绑定字段接口 | `DisplayItemModel.bindModelToInterface()`        | [FlowEngine → 字段扩展](../flow-engine/field) |
| 模型注册     | `this.flowEngine.registerModelLoaders()`         | [Plugin 插件](../plugin)                      |

## 相关链接

- [编写第一个插件](../../write-your-first-plugin) — 从零创建插件骨架
- [FlowEngine 概述](../flow-engine/index.md) — FlowModel 基础用法
- [FlowEngine → 字段扩展](../flow-engine/field) — FieldModel、ClickableFieldModel、bindModelToInterface
- [FlowEngine → 区块扩展](../flow-engine/block) — 自定义区块
- [Component vs FlowModel](../component-vs-flow-model) — 什么时候用 FlowModel
- [Plugin 插件](../plugin) — 插件入口和 load() 生命周期
- [i18n 国际化](../component/i18n) — 翻译文件写法和 tExpr 用法
- [FlowEngine 完整文档](../../../flow-engine/index.md) — FlowModel、Flow、Context 的完整参考
