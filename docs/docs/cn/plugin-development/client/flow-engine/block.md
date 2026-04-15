---
title: "区块扩展"
description: "NocoBase 区块扩展开发：BlockModel、DataBlockModel、CollectionBlockModel、TableBlockModel 基类与注册方式。"
keywords: "区块扩展,Block,BlockModel,DataBlockModel,CollectionBlockModel,TableBlockModel,renderComponent,NocoBase"
---

# 区块扩展

在 NocoBase 中，**区块（Block）** 是页面上的内容区域——比如表格、表单、图表、详情等。通过继承 BlockModel 系列基类，你可以创建自定义区块并注册到「添加区块」菜单中。

## 基类选择

NocoBase 提供了三个区块基类，根据你的数据需求选择：

| 基类                   | 继承关系                              | 适用场景                                   |
| ---------------------- | ------------------------------------- | ------------------------------------------ |
| `BlockModel`           | 最基础的区块                          | 不需要数据源的展示区块                     |
| `DataBlockModel`       | 继承 `BlockModel`                     | 需要数据但不绑定 NocoBase 数据表           |
| `CollectionBlockModel` | 继承 `DataBlockModel`                 | 绑定 NocoBase 数据表，自动获取数据         |
| `TableBlockModel`      | 继承 `CollectionBlockModel`           | 完整的表格区块，自带字段列、操作栏、分页等 |

继承链路是：`BlockModel` → `DataBlockModel` → `CollectionBlockModel` → `TableBlockModel`。

通常来说，如果你想要一个开箱即用的表格区块，直接用 `TableBlockModel`——它自带字段列、操作栏、分页、排序等完整能力，是用得最多的基类。如果你需要完全自定义渲染方式（比如用卡片列表、时间线等），用 `CollectionBlockModel` 自己写 `renderComponent`。如果只是展示静态内容或自定义 UI，用 `BlockModel` 就够了。

`DataBlockModel` 的定位比较特殊——它本身不添加任何新属性或方法，类体是空的。它的作用是**分类标识**：继承 `DataBlockModel` 的区块会被归入 UI 上的「数据区块」分组菜单。如果你的区块需要自己管理数据获取逻辑（不走 NocoBase 标准的 Collection 绑定），可以继承 `DataBlockModel`。比如图表插件的 `ChartBlockModel` 就是这样——它用自定义的 `ChartResource` 获取数据，不需要标准的数据表绑定。大多数场景下你不需要直接用 `DataBlockModel`，用 `CollectionBlockModel` 或 `TableBlockModel` 就够了。

## BlockModel 示例

一个最简单的区块——支持编辑 HTML 内容：

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_17.23.49.mp4" type="video/mp4">
</video>

```tsx
// models/SimpleBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender',
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

这个示例覆盖了区块开发的三个步骤：

1. **`renderComponent()`** — 渲染区块 UI，通过 `this.props` 读取属性
2. **`define()`** — 设置区块在「添加区块」菜单里的显示名
3. **`registerFlow()`** — 添加可视化配置面板，用户可以在界面上编辑 HTML 内容

## CollectionBlockModel 示例

如果区块需要绑定 NocoBase 的数据表，用 `CollectionBlockModel`。它会自动处理数据获取：

```tsx
// models/ManyRecordBlockModel.tsx
import React from 'react';
import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '@nocobase/flow-engine';

export class ManyRecordBlockModel extends CollectionBlockModel {
  // 声明这是一个多条记录的区块
  static scene = BlockSceneEnum.many;

  createResource() {
    return this.context.makeResource(MultiRecordResource);
  }

  get resource() {
    return this.context.resource as MultiRecordResource;
  }

  renderComponent() {
    return (
      <div>
        <h3>数据表区块</h3>
        {/* resource.getData() 获取数据表的数据 */}
        <pre>{JSON.stringify(this.resource.getData(), null, 2)}</pre>
      </div>
    );
  }
}

ManyRecordBlockModel.define({
  label: tExpr('Many records'),
});
```

跟 `BlockModel` 比，`CollectionBlockModel` 多了这些：

- **`static scene`** — 声明区块场景。常用值：`BlockSceneEnum.many`（多条记录列表）、`BlockSceneEnum.one`（单条记录详情/表单）。完整枚举还包括 `new`、`select`、`filter`、`subForm`、`bulkEditForm` 等
- **`createResource()`** — 创建数据资源，`MultiRecordResource` 用于获取多条记录
- **`this.resource.getData()`** — 获取数据表的数据

## TableBlockModel 示例

`TableBlockModel` 继承自 `CollectionBlockModel`，是 NocoBase 内置的完整表格区块——自带字段列、操作栏、分页、排序等能力。用户在「添加区块」里选择「Table」用的就是它。

通常来说，如果内置的 `TableBlockModel` 已经满足需求，用户直接在界面上添加就行，开发者不需要做任何事。只有当你需要**在 TableBlockModel 基础上做定制**时，才需要继承它——比如：

- 覆盖 `customModelClasses` 替换内置的操作组或字段列模型
- 通过 `filterCollection` 限制只对特定数据表可用
- 注册额外的 Flow 添加自定义配置项

```tsx
// 示例：限制只对 todoItems 数据表可用的表格区块
import { TableBlockModel } from '@nocobase/client-v2';
import type { Collection } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class TodoBlockModel extends TableBlockModel {
  static filterCollection(collection: Collection) {
    return collection.name === 'todoItems';
  }
}

TodoBlockModel.define({
  label: tExpr('Todo block'),
});
```

完整的 `TableBlockModel` 定制示例见 [做一个前后端联动的数据管理插件](../examples/fullstack-plugin)。

## 注册区块

在 Plugin 的 `load()` 中注册：

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class MyPlugin extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      SimpleBlockModel: {
        loader: () => import('./models/SimpleBlockModel'),
      },
      ManyRecordBlockModel: {
        loader: () => import('./models/ManyRecordBlockModel'),
      },
    });
  }
}
```

注册完成后，在 NocoBase 界面点击「添加区块」就能看到你的自定义区块了。

## 完整源码

- [@nocobase-example/plugin-simple-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block) — BlockModel 示例
- [@nocobase-example/plugin-collection-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-collection-block) — CollectionBlockModel 示例

## 相关链接

- [插件实战：做一个自定义展示区块](../examples/custom-block) — 从零搭建一个可配置的 BlockModel 区块
- [插件实战：做一个前后端联动的数据管理插件](../examples/fullstack-plugin) — TableBlockModel + 自定义字段 + 自定义操作的完整示例
- [FlowEngine 概述](../flow-engine/index.md) — FlowModel 基础用法和 registerFlow
- [字段扩展](./field) — 自定义字段组件
- [操作扩展](./action) — 自定义操作按钮
- [Resource API 速查表](../../../api/flow-engine/resource.md) — MultiRecordResource / SingleRecordResource 的完整方法签名
- [FlowDefinition 流定义](../../../flow-engine/definitions/flow-definition.md) — registerFlow 的完整参数和事件类型
- [FlowEngine 完整文档](../../../flow-engine/index.md) — 完整参考
