---
title: "操作扩展"
description: "NocoBase 操作扩展开发：ActionModel 基类、ActionSceneEnum 操作场景、自定义操作按钮。"
keywords: "操作扩展,Action,ActionModel,ActionSceneEnum,操作按钮,NocoBase"
---

# 操作扩展

在 NocoBase 中，**操作（Action）** 是区块里的按钮，用于触发业务逻辑——比如"新建"、"编辑"、"删除"等。通过继承 `ActionModel` 基类，你可以添加自定义操作按钮。

## 操作场景

每个操作需要声明它出现的场景，通过 `static scene` 属性指定：

| 场景       | 值                           | 说明                                       |
| ---------- | ---------------------------- | ------------------------------------------ |
| collection | `ActionSceneEnum.collection` | 作用于数据表，比如"新建"按钮               |
| record     | `ActionSceneEnum.record`     | 作用于单条记录，比如"编辑"、"删除"按钮     |
| both       | `ActionSceneEnum.both`       | 两种场景都可用                             |
| all        | `ActionSceneEnum.all`        | 所有场景都可用（包括特殊上下文，如弹窗等） |

## 示例

### 数据表级操作

作用于整个数据表，出现在区块顶部的操作栏：

```tsx
// models/SimpleCollectionActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleCollectionActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    children: tExpr('Simple collection action'),
  };
}

SimpleCollectionActionModel.define({
  label: tExpr('Simple collection action'),
});
```

### 记录级操作

作用于单条记录，出现在表格每行的操作列：

```tsx
// models/SimpleRecordActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleRecordActionModel extends ActionModel {
  static scene = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    children: tExpr('Simple record action'),
  };
}

SimpleRecordActionModel.define({
  label: tExpr('Simple record action'),
});
```

### 两种场景都适用

如果操作不区分场景，用 `ActionSceneEnum.both`：

```tsx
// models/SimpleBothActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleBothActionModel extends ActionModel {
  static scene = ActionSceneEnum.both;

  defaultProps: ButtonProps = {
    children: tExpr('Simple both action'),
  };
}

SimpleBothActionModel.define({
  label: tExpr('Simple both action'),
});
```

三种写法的结构是一样的——区别只在 `static scene` 的值和 `defaultProps` 里的按钮文案。

## 注册操作

在 Plugin 的 `load()` 中用 `registerModelLoaders` 按需加载注册：

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginSimpleActionClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      SimpleCollectionActionModel: {
        loader: () => import('./models/SimpleCollectionActionModel'),
      },
      SimpleRecordActionModel: {
        loader: () => import('./models/SimpleRecordActionModel'),
      },
      SimpleBothActionModel: {
        loader: () => import('./models/SimpleBothActionModel'),
      },
    });
  }
}
```

注册完成后，在区块的「配置操作」中就能添加你的自定义操作按钮了。

## 完整源码

- [@nocobase-example/plugin-simple-action](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-action) — 三种操作场景的完整示例

## 相关链接

- [插件实战：做一个自定义操作按钮](../examples/custom-action) — 从零搭建三种场景的操作按钮
- [插件实战：做一个前后端联动的数据管理插件](../examples/fullstack-plugin) — 自定义操作 + ctx.viewer.dialog 在完整插件中的实际应用
- [FlowEngine 概述](../flow-engine/index.md) — FlowModel 基础用法
- [区块扩展](./block) — 自定义区块
- [字段扩展](./field) — 自定义字段组件
- [FlowDefinition 流定义](../../../flow-engine/definitions/flow-definition.md) — registerFlow 的完整参数和事件类型
- [FlowEngine 完整文档](../../../flow-engine/index.md) — 完整参考
