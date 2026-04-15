---
title: "做一个自定义操作按钮"
description: "NocoBase 插件实战：用 ActionModel + ActionSceneEnum 做自定义操作按钮，支持数据表级和记录级操作。"
keywords: "自定义操作,ActionModel,ActionSceneEnum,操作按钮,NocoBase"
---

# 做一个自定义操作按钮

在 NocoBase 中，操作（Action）是区块里的按钮，用于触发业务逻辑——比如「新建」「编辑」「删除」等。这个示例展示怎么用 `ActionModel` 做自定义操作按钮，并通过 `ActionSceneEnum` 控制按钮出现的场景。

:::tip 前置阅读

建议先了解以下内容，开发时会更顺畅：

- [编写第一个插件](../../write-your-first-plugin) — 插件创建和目录结构
- [Plugin 插件](../plugin) — 插件入口和 `load()` 生命周期
- [FlowEngine → 操作扩展](../flow-engine/action) — ActionModel、ActionSceneEnum 基础介绍
- [i18n 国际化](../component/i18n) — 翻译文件写法和 `tExpr()` 延迟翻译的用法

:::

## 最终效果

我们要做三个自定义操作按钮，分别对应三种操作场景：

- **数据表级操作**（`collection`）— 出现在区块顶部的操作栏，比如「新建」按钮旁边
- **记录级操作**（`record`）— 出现在表格每行的操作列，比如「编辑」「删除」旁边
- **两者都适用**（`both`）— 两种场景都会出现

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-08_17.55.43.mp4" type="video/mp4">
</video>

完整源码见 [@nocobase-example/plugin-simple-action](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-action)。如果你想直接在本地跑起来看效果：

```bash
yarn pm enable @nocobase-example/plugin-simple-action
```

下面从零开始，一步步搭建这个插件。

## 第一步：创建插件骨架

在仓库根目录执行：

```bash
yarn pm create @my-project/plugin-simple-action
```

详细说明见 [编写第一个插件](../../write-your-first-plugin)。

## 第二步：创建操作模型

每个操作需要声明它出现的场景，通过 `static scene` 属性指定：

| 场景       | 值                           | 说明                                     |
| ---------- | ---------------------------- | ---------------------------------------- |
| collection | `ActionSceneEnum.collection` | 作用于数据表，比如「新建」按钮           |
| record     | `ActionSceneEnum.record`     | 作用于单条记录，比如「编辑」「删除」按钮 |
| both       | `ActionSceneEnum.both`       | 两种场景都可用                           |

### 数据表级操作

新建 `src/client-v2/models/SimpleCollectionActionModel.tsx`：

```tsx
// src/client-v2/models/SimpleCollectionActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class SimpleCollectionActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    children: tExpr('Simple collection action'),
  };
}

SimpleCollectionActionModel.define({
  label: tExpr('Simple collection action'),
});

// 通过 registerFlow 监听点击事件，用 ctx.message 给用户反馈
SimpleCollectionActionModel.registerFlow({
  key: 'clickFlow',
  title: tExpr('Simple collection action'),
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        ctx.message.success(ctx.t('Collection action clicked'));
      },
    },
  },
});
```

### 记录级操作

新建 `src/client-v2/models/SimpleRecordActionModel.tsx`：

```tsx
// src/client-v2/models/SimpleRecordActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class SimpleRecordActionModel extends ActionModel {
  static scene = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    children: tExpr('Simple record action'),
  };
}

SimpleRecordActionModel.define({
  label: tExpr('Simple record action'),
});

// 记录级操作可以通过 ctx.model.context 拿到当前行的数据和索引
SimpleRecordActionModel.registerFlow({
  key: 'clickFlow',
  title: tExpr('Simple record action'),
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        const index = ctx.model.context.recordIndex;
        const record = ctx.model.context.record;
        const id = record?.id;
        ctx.message.info(ctx.t('Record action clicked, record ID: {{id}}, row index: {{index}}', { id, index }));
      },
    },
  },
});
```

### 两种场景都适用

新建 `src/client-v2/models/SimpleBothActionModel.tsx`：

```tsx
// src/client-v2/models/SimpleBothActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class SimpleBothActionModel extends ActionModel {
  static scene = ActionSceneEnum.both;

  defaultProps: ButtonProps = {
    children: tExpr('Simple both action'),
  };
}

SimpleBothActionModel.define({
  label: tExpr('Simple both action'),
});

SimpleBothActionModel.registerFlow({
  key: 'clickFlow',
  title: tExpr('Simple both action'),
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        ctx.message.info(ctx.t('Both action clicked'));
      },
    },
  },
});
```

三种写法的结构一样——区别只在 `static scene` 的值和按钮文案。每个按钮都通过 `registerFlow({ on: 'click' })` 监听点击事件，用 `ctx.message` 弹出提示，让用户能看到按钮确实生效了。

## 第三步：添加多语言文件

编辑插件的 `src/locale/` 下的翻译文件：

```json
// src/locale/zh-CN.json
{
  "Simple collection action": "简单数据表操作",
  "Simple record action": "简单记录操作",
  "Simple both action": "简单通用操作",
  "Collection action clicked": "数据表操作被点击了",
  "Record action clicked, record ID: {{id}}, row index: {{index}}": "记录操作被点击了，记录 ID：{{id}}，行索引：{{index}}",
  "Both action clicked": "通用操作被点击了"
}
```

```json
// src/locale/en-US.json
{
  "Simple collection action": "Simple collection action",
  "Simple record action": "Simple record action",
  "Simple both action": "Simple both action",
  "Collection action clicked": "Collection action clicked",
  "Record action clicked, record ID: {{id}}, row index: {{index}}": "Record action clicked, record ID: {{id}}, row index: {{index}}",
  "Both action clicked": "Both action clicked"
}
```

:::warning 注意

初次添加语言文件需要重启应用才能生效。

:::

关于翻译文件的写法和 `tExpr()` 的更多用法，详见 [i18n 国际化](../component/i18n)。

## 第四步：在插件中注册

编辑 `src/client-v2/plugin.tsx`，用 `registerModelLoaders` 按需加载注册：

```ts
// src/client-v2/plugin.tsx
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

export default PluginSimpleActionClient;
```

## 第五步：启用插件

```bash
yarn pm enable @my-project/plugin-simple-action
```

启用后，在表格区块的「配置操作」中就能添加这些自定义操作按钮了。

## 完整源码

- [@nocobase-example/plugin-simple-action](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-action) — 三种操作场景的完整示例

## 小结

这个示例用到的能力：

| 能力     | 用法                                         | 文档                                           |
| -------- | -------------------------------------------- | ---------------------------------------------- |
| 操作按钮 | `ActionModel` + `static scene`               | [FlowEngine → 操作扩展](../flow-engine/action) |
| 操作场景 | `ActionSceneEnum.collection / record / both / all` | [FlowEngine → 操作扩展](../flow-engine/action) |
| 菜单注册 | `define({ label })`                          | [FlowEngine 概述](../flow-engine/index.md)     |
| 模型注册 | `this.flowEngine.registerModelLoaders()`     | [Plugin 插件](../plugin)                       |
| 延迟翻译 | `tExpr()`                                    | [i18n 国际化](../component/i18n)               |

## 相关链接

- [编写第一个插件](../../write-your-first-plugin) — 从零创建插件骨架
- [FlowEngine 概述](../flow-engine/index.md) — FlowModel 基础用法
- [FlowEngine → 操作扩展](../flow-engine/action) — ActionModel、ActionSceneEnum
- [FlowEngine → 区块扩展](../flow-engine/block) — 自定义区块
- [FlowEngine → 字段扩展](../flow-engine/field) — 自定义字段组件
- [Component vs FlowModel](../component-vs-flow-model) — 什么时候用 FlowModel
- [Plugin 插件](../plugin) — 插件入口和 load() 生命周期
- [i18n 国际化](../component/i18n) — 翻译文件写法和 tExpr 用法
- [FlowEngine 完整文档](../../../flow-engine/index.md) — FlowModel、Flow、Context 的完整参考
