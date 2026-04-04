---
title: "区块扩展"
description: "NocoBase 区块扩展开发：BlockModel、DataBlockModel、CollectionBlockModel 基类与注册方式。"
keywords: "区块扩展,Block,BlockModel,DataBlockModel,CollectionBlockModel,renderComponent,NocoBase"
---

# 区块扩展

在 NocoBase 中，**区块（Block）** 是页面上的内容区域——比如表格、表单、图表、详情等。通过继承 BlockModel 系列基类，你可以创建自定义区块并注册到「添加区块」菜单中。

## 基类选择

NocoBase 提供了三个区块基类，根据你的数据需求选择：

| 基类                   | 说明                     | 适用场景                           |
| ---------------------- | ------------------------ | ---------------------------------- |
| `BlockModel`           | 最基础的区块             | 不需要数据源的展示区块             |
| `DataBlockModel`       | 需要自行获取数据         | 需要数据但不绑定 NocoBase 数据表   |
| `CollectionBlockModel` | 绑定数据表，自动获取数据 | 最常用，绑定 NocoBase 数据表的区块 |

通常来说，如果你的区块需要展示数据表的数据，直接用 `CollectionBlockModel`；如果只是展示一些静态内容或自定义 UI，用 `BlockModel` 就够了。

## 最小示例：BlockModel

一个最简单的区块——支持编辑 HTML 内容：

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
    return this.context.createResource(MultiRecordResource);
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

- **`static scene`** — 声明区块场景，`BlockSceneEnum.many` 表示多条记录
- **`createResource()`** — 创建数据资源，`MultiRecordResource` 用于获取多条记录
- **`this.resource.getData()`** — 获取数据表的数据

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

- [@nocobase-example/plugin-simple-block](https://github.com/nocobase/nocobase/tree/main/packages/plugins/%40nocobase-example/plugin-simple-block) — BlockModel 示例
- [@nocobase-example/plugin-collection-block](https://github.com/nocobase/nocobase/tree/main/packages/plugins/%40nocobase-example/plugin-collection-block) — CollectionBlockModel 示例

## 相关链接

- [FlowEngine 概述](../flow-engine/index.md) — FlowModel 基础用法和 registerFlow
- [字段扩展](./field) — 自定义字段组件
- [操作扩展](./action) — 自定义操作按钮
- [FlowEngine 完整文档](../../../flow-engine/index.md) — 完整参考
