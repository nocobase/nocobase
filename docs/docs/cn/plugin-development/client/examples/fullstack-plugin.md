---
title: "做一个前后端联动的数据管理插件"
description: "NocoBase 插件实战：Server 定义数据表 + Client 用 TableBlockModel 展示数据 + 自定义字段和操作，完整的前后端联动插件。"
keywords: "前后端联动,TableBlockModel,defineCollection,ActionModel,ClickableFieldModel,ctx.viewer,NocoBase"
---

# 做一个前后端联动的数据管理插件

前面的示例要么纯客户端（区块、字段、操作），要么客户端 + 简单接口（设置页）。这个示例展示一个更完整的场景——服务端定义数据表，客户端继承 `TableBlockModel` 获得完整的表格能力，再加上自定义字段组件和自定义操作按钮，组成一个有增删改查的数据管理插件。

这个示例把前面学到的区块、字段、操作串在一起，展示一个完整插件的开发流程。

:::tip 前置阅读

建议先了解以下内容，开发时会更顺畅：

- [编写第一个插件](../../write-your-first-plugin) — 插件创建和目录结构
- [Plugin 插件](../plugin) — 插件入口和 `load()` 生命周期
- [FlowEngine → 区块扩展](../flow-engine/block) — BlockModel、CollectionBlockModel、TableBlockModel
- [FlowEngine → 字段扩展](../flow-engine/field) — ClickableFieldModel、bindModelToInterface
- [FlowEngine → 操作扩展](../flow-engine/action) — ActionModel、ActionSceneEnum
- [i18n 国际化](../component/i18n) — 翻译文件写法和 `tExpr()` 用法
- [服务端开发概述](../../server) — 服务端插件基础

:::

## 最终效果

我们要做的是一个「待办事项」数据管理插件，包含以下能力：

- 服务端定义一张 `todoItems` 数据表，插件安装时自动写入示例数据
- 客户端继承 `TableBlockModel`，开箱即用的表格区块（字段列、分页、操作栏等）
- 自定义字段组件——用彩色 Tag 渲染 priority 字段
- 自定义操作按钮——「新建待办」按钮，点击弹窗填写表单创建记录

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-08_16.32.52.mp4" type="video/mp4">
</video>

完整源码见 [@nocobase-example/plugin-custom-table-block-resource](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-custom-table-block-resource)。如果你想直接在本地跑起来看效果：

```bash
yarn pm enable @nocobase-example/plugin-custom-table-block-resource
```

下面从零开始，一步步搭建这个插件。

## 第一步：创建插件骨架

在仓库根目录执行：

```bash
yarn pm create @my-project/plugin-custom-table-block-resource
```

详细说明见 [编写第一个插件](../../write-your-first-plugin)。

## 第二步：定义数据表（服务端）

新建 `src/server/collections/todoItems.ts`，NocoBase 会自动加载这个目录下的 collection 定义：

```ts
// src/server/collections/todoItems.ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'todoItems',
  title: 'Todo Items',
  fields: [
    { name: 'title', type: 'string', title: 'Title' },
    {
      name: 'completed',
      type: 'boolean',
      title: 'Completed',
      defaultValue: false,
    },
    {
      name: 'priority',
      type: 'string',
      title: 'Priority',
      defaultValue: 'medium',
    },
  ],
});
```

跟设置页示例不同，这里不需要手动注册 resource——NocoBase 会为每个 collection 自动生成标准的 CRUD 接口（`list`、`get`、`create`、`update`、`destroy`）。

## 第三步：配置权限和示例数据（服务端）

编辑 `src/server/plugin.ts`，在 `load()` 里配置 ACL 权限，在 `install()` 里插入示例数据：

```ts
// src/server/plugin.ts
import { Plugin } from '@nocobase/server';

export class PluginDataBlockServer extends Plugin {
  async load() {
    // 登录用户可以对 todoItems 进行增删改查
    this.app.acl.allow('todoItems', ['list', 'get', 'create', 'update', 'destroy'], 'loggedIn');
  }

  async install() {
    // 插件首次安装时，插入几条示例数据
    const repo = this.db.getRepository('todoItems');
    const count = await repo.count();
    if (count === 0) {
      await repo.createMany({
        records: [
          { title: 'Learn NocoBase plugin development', completed: true, priority: 'high' },
          { title: 'Build a custom block', completed: false, priority: 'high' },
          { title: 'Write documentation', completed: false, priority: 'medium' },
          { title: 'Add unit tests', completed: false, priority: 'low' },
        ],
      });
    }
  }
}

export default PluginDataBlockServer;
```

几个关键点：

- **`acl.allow()`** — `['list', 'get', 'create', 'update', 'destroy']` 开放完整的增删改查权限，`'loggedIn'` 表示登录用户即可访问
- **`install()`** — 只在插件首次安装时执行，适合用来写入初始数据
- **`this.db.getRepository()`** — 通过 collection 名称拿到数据操作对象
- 不需要 `resourceManager.define()`——NocoBase 会为 collection 自动生成 CRUD 接口

## 第四步：创建区块模型（客户端）

新建 `src/client-v2/models/TodoBlockModel.tsx`。继承 `TableBlockModel` 可以直接获得完整的表格区块能力——字段列、操作栏、分页、排序等，不需要自己写 `renderComponent`。

![20260408164204](https://static-docs.nocobase.com/20260408164204.png)

:::tip 提示

实际插件开发中，如果不需要定制化 `TableBlockModel` 的话，其实可以不用继承和注册这个区块，直接让用户在添加区块的时候选择 「表格」即可。本文是为了展示区块模型的定义和注册流程，所以才写了一个 `TodoBlockModel` 来继承 `TableBlockModel`。`TableBlockModel` 会处理其余所有事情（字段列、操作栏、分页等）。

:::

```tsx
// src/client-v2/models/TodoBlockModel.tsx
import { TableBlockModel } from '@nocobase/client-v2';
import type { Collection } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class TodoBlockModel extends TableBlockModel {
  // 限制只对 todoItems 数据表可用
  static filterCollection(collection: Collection) {
    return collection.name === 'todoItems';
  }
}

TodoBlockModel.define({
  label: tExpr('Todo block'),
});
```

通过 `filterCollection` 限制这个区块只对 `todoItems` 数据表可用——用户添加「Todo block」时，数据表选择列表里只会出现 `todoItems`，不会出现其他不相关的表。

![20260408170026](https://static-docs.nocobase.com/20260408170026.png)

## 第五步：创建自定义字段组件（客户端）

新建 `src/client-v2/models/PriorityFieldModel.tsx`。用彩色 Tag 渲染 priority 字段，比纯文本直观得多：

![20260408163645](https://static-docs.nocobase.com/20260408163645.png)

```tsx
// src/client-v2/models/PriorityFieldModel.tsx
import React from 'react';
import { ClickableFieldModel } from '@nocobase/client-v2';
import { DisplayItemModel } from '@nocobase/flow-engine';
import { Tag } from 'antd';
import { tExpr } from '../locale';

const priorityColors: Record<string, string> = {
  high: 'red',
  medium: 'orange',
  low: 'green',
};

export class PriorityFieldModel extends ClickableFieldModel {
  public renderComponent(value: string) {
    if (!value) return <span>-</span>;
    return <Tag color={priorityColors[value] || 'default'}>{value}</Tag>;
  }
}

PriorityFieldModel.define({
  label: tExpr('Priority tag'),
});

// 绑定到 input（单行文本）类型的字段接口
DisplayItemModel.bindModelToInterface('PriorityFieldModel', ['input']);
```

注册后，在表格的 priority 列配置里，「字段组件」下拉菜单就能切换到「Priority tag」。

## 第六步：创建自定义操作按钮（客户端）

新建 `src/client-v2/models/NewTodoActionModel.tsx`。点击「新建待办」按钮后，用 `ctx.viewer.dialog()` 打开弹窗，填写表单后创建记录：

![20260408163810](https://static-docs.nocobase.com/20260408163810.png)

```tsx
// src/client-v2/models/NewTodoActionModel.tsx
import React from 'react';
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { MultiRecordResource, observable, observer } from '@nocobase/flow-engine';
import { Button, Form, Input, Select, Space, Switch } from 'antd';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

// 用 observable 管理加载状态，替代 useState
const formState = observable({
  loading: false,
});

// 弹窗内的表单组件，用 observer 包裹以响应 observable 变化
const NewTodoForm = observer(function NewTodoForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (values: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    const values = await form.validateFields();
    formState.loading = true;
    try {
      await onSubmit(values);
    } finally {
      formState.loading = false;
    }
  };

  return (
    <Form form={form} layout="vertical" initialValues={{ priority: 'medium', completed: false }}>
      <Form.Item label="Title" name="title" rules={[{ required: true, message: 'Please enter title' }]}>
        <Input placeholder="Enter todo title" />
      </Form.Item>
      <Form.Item label="Priority" name="priority">
        <Select
          options={[
            { label: 'High', value: 'high' },
            { label: 'Medium', value: 'medium' },
            { label: 'Low', value: 'low' },
          ]}
        />
      </Form.Item>
      <Form.Item label="Completed" name="completed" valuePropName="checked">
        <Switch />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" onClick={handleSubmit} loading={formState.loading}>
            OK
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </Space>
      </Form.Item>
    </Form>
  );
});

export class NewTodoActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    type: 'primary',
    children: tExpr('New todo'),
  };
}

NewTodoActionModel.define({
  label: tExpr('New todo'),
});

NewTodoActionModel.registerFlow({
  key: 'newTodoFlow',
  title: tExpr('New todo'),
  on: 'click', // 监听按钮点击事件
  steps: {
    openForm: {
      async handler(ctx) {
        const resource = ctx.blockModel?.resource as MultiRecordResource;
        if (!resource) return;

        // 使用 ctx.viewer.dialog 打开弹窗
        ctx.viewer.dialog({
          content: (view) => (
            <NewTodoForm
              onSubmit={async (values) => {
                await resource.create(values);
                ctx.message.success(ctx.t('Created successfully'));
                view.close();
              }}
              onCancel={() => view.close()}
            />
          ),
        });
      },
    },
  },
});
```

几个关键点：

- **`ActionSceneEnum.collection`** — 按钮出现在区块顶部的操作栏
- **`on: 'click'`** — 通过 `registerFlow` 监听按钮的 `click` 事件
- **`ctx.viewer.dialog()`** — NocoBase 内置的弹窗能力，`content` 接收一个函数，参数 `view` 可以调用 `view.close()` 关闭弹窗
- **`resource.create(values)`** — 调用数据表的 create 接口创建记录，创建后表格会自动刷新
- **`observable` + `observer`** — 用 flow-engine 提供的响应式状态管理替代 `useState`，组件会自动响应 `formState.loading` 的变化

## 第七步：添加多语言文件

编辑插件的 `src/locale/` 下的翻译文件：

```json
// src/locale/zh-CN.json
{
  "Todo block": "待办事项区块",
  "Priority tag": "优先级标签",
  "New todo": "新建待办",
  "Todo form": "待办表单",
  "Title": "标题",
  "Priority": "优先级",
  "Completed": "已完成",
  "Created successfully": "创建成功"
}
```

```json
// src/locale/en-US.json
{
  "Todo block": "Todo block",
  "Priority tag": "Priority tag",
  "New todo": "New todo",
  "Todo form": "Todo form",
  "Title": "Title",
  "Priority": "Priority",
  "Completed": "Completed",
  "Created successfully": "Created successfully"
}
```

:::warning 注意

初次添加语言文件需要重启应用才能生效。

:::

关于翻译文件的写法和 `tExpr()` 的更多用法，详见 [i18n 国际化](../component/i18n)。

## 第八步：在插件中注册（客户端）

编辑 `src/client-v2/plugin.tsx`。需要做两件事：注册模型，以及把 `todoItems` 注册到客户端数据源。

:::warning 注意

在插件代码里通过 `addCollection` 手动注册数据表是一种**少见的做法**，这里只是为了演示前后端联动的完整流程。实际项目中，数据表通常由用户在 NocoBase 界面上创建和配置，或者通过 API / MCP 等方式管理，不需要在插件客户端代码里显式注册。

:::

通过 `defineCollection` 定义的表是服务端内部表，默认不会出现在区块的数据表选择列表中。通过 `addCollection` 手动注册后，用户在添加区块时就能选到 `todoItems` 了。

![20260408164023](https://static-docs.nocobase.com/20260408164023.png)

```ts
// src/client-v2/plugin.tsx
import { Plugin } from '@nocobase/client-v2';

const todoItemsCollection = {
  name: 'todoItems',
  title: 'Todo Items',
  // filterTargetKey 必须设置，否则 collection 不会出现在区块的数据表选择列表中
  filterTargetKey: 'id',
  fields: [
    {
      type: 'bigInt',
      name: 'id',
      primaryKey: true,
      autoIncrement: true,
      interface: 'id',
    },
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: { type: 'string', title: 'Title', 'x-component': 'Input' },
    },
    {
      type: 'boolean',
      name: 'completed',
      interface: 'checkbox',
      uiSchema: { type: 'boolean', title: 'Completed', 'x-component': 'Checkbox' },
    },
    {
      type: 'string',
      name: 'priority',
      interface: 'input',
      uiSchema: { type: 'string', title: 'Priority', 'x-component': 'Input' },
    },
  ],
};

export class PluginCustomTableBlockResourceClientV2 extends Plugin {
  async load() {
    // 注册区块、字段、操作模型
    this.flowEngine.registerModelLoaders({
      TodoBlockModel: {
        loader: () => import('./models/TodoBlockModel'),
      },
      PriorityFieldModel: {
        loader: () => import('./models/PriorityFieldModel'),
      },
      NewTodoActionModel: {
        loader: () => import('./models/NewTodoActionModel'),
      },
    });

    // Register todoItems to the client-side data source.
    // Must listen to 'dataSource:loaded' event because ensureLoaded() runs after load(),
    // and it calls setCollections() which clears all collections before re-setting from server.
    // Re-register in the event callback to ensure addCollection survives reload.
    const addTodoCollection = () => {
      const mainDS = this.flowEngine.dataSourceManager.getDataSource('main');
      if (mainDS && !mainDS.getCollection('todoItems')) {
        mainDS.addCollection(todoItemsCollection);
      }
    };

    this.app.eventBus.addEventListener('dataSource:loaded', (event: Event) => {
      if ((event as CustomEvent).detail?.dataSourceKey === 'main') {
        addTodoCollection();
      }
    });
  }
}

export default PluginCustomTableBlockResourceClientV2;
```

几个关键点：

- **`registerModelLoaders`** — 按需加载注册三个模型：区块、字段、操作
- **`this.app.eventBus`** — 应用级事件总线，用于监听生命周期事件
- **`dataSource:loaded` 事件** — 数据源加载完成后触发。必须在这个事件回调里调用 `addCollection`，因为 `ensureLoaded()` 会在 `load()` 之后运行，它会先清空再重新设置所有 collection——直接在 `load()` 里调用 `addCollection` 会被覆盖
- **`addCollection()`** — 把 collection 注册到客户端数据源。字段需要带 `interface` 和 `uiSchema` 属性，这样 NocoBase 才知道怎么渲染
- **`filterTargetKey: 'id'`** — 必须设置，指定用于唯一标识记录的字段（通常是主键）。如果不设置，collection 不会出现在区块的数据表选择列表中
- 服务端的 `defineCollection` 负责创建物理表和 ORM 映射，客户端的 `addCollection` 负责让 UI 知道这张表的存在——两边配合才能完成前后端联动

## 第九步：启用插件

```bash
yarn pm enable @my-project/plugin-custom-table-block-resource
```

启用后：

1. 新建一个页面，点击「添加区块」，选择「Todo block」，绑定 `todoItems` 数据表
2. 表格会自动加载数据，显示字段列、分页等
3. 在「配置操作」里添加「New todo」按钮，点击后弹窗填写表单创建记录
4. 在 priority 列的「字段组件」里切换到「Priority tag」，priority 会用彩色 Tag 展示

<!-- 需要一张启用后完整功能的截图 -->

## 完整源码

- [@nocobase-example/plugin-custom-table-block-resource](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-custom-table-block-resource) — 前后端联动数据管理插件完整示例

## 小结

这个示例用到的能力：

| 能力             | 用法                                            | 文档                                                    |
| ---------------- | ----------------------------------------------- | ------------------------------------------------------- |
| 定义数据表       | `defineCollection()`                            | [服务端 → Collections 数据表](../../server/collections) |
| 权限控制         | `acl.allow()`                                   | [服务端 → ACL 权限控制](../../server/acl)               |
| 初始数据         | `install()` + `repo.createMany()`               | [服务端 → Plugin 插件](../../server/plugin)             |
| 表格区块         | `TableBlockModel`                               | [FlowEngine → 区块扩展](../flow-engine/block)           |
| 客户端注册数据表 | `addCollection()` + `eventBus` + `filterTargetKey` | [Plugin 插件](../plugin)                                |
| 自定义字段       | `ClickableFieldModel` + `bindModelToInterface`  | [FlowEngine → 字段扩展](../flow-engine/field)           |
| 自定义操作       | `ActionModel` + `registerFlow({ on: 'click' })` | [FlowEngine → 操作扩展](../flow-engine/action)          |
| 弹窗             | `ctx.viewer.dialog()`                           | [Context → 常用能力](../ctx/common-capabilities)        |
| 响应式状态       | `observable` + `observer`                       | [Component 组件开发](../component/index.md)             |
| 模型注册         | `this.flowEngine.registerModelLoaders()`        | [Plugin 插件](../plugin)                                |
| 延迟翻译         | `tExpr()`                                       | [i18n 国际化](../component/i18n)                        |

## 相关链接

- [编写第一个插件](../../write-your-first-plugin) — 从零创建插件骨架
- [FlowEngine 概述](../flow-engine/index.md) — FlowModel 基础用法和 registerFlow
- [FlowEngine → 区块扩展](../flow-engine/block) — BlockModel、TableBlockModel
- [FlowEngine → 字段扩展](../flow-engine/field) — ClickableFieldModel、bindModelToInterface
- [FlowEngine → 操作扩展](../flow-engine/action) — ActionModel、ActionSceneEnum
- [做一个自定义展示区块](./custom-block) — BlockModel 基础示例
- [做一个自定义字段组件](./custom-field) — FieldModel 基础示例
- [做一个自定义操作按钮](./custom-action) — ActionModel 基础示例
- [服务端开发概述](../../server) — 服务端插件基础
- [服务端 → Collections 数据表](../../server/collections) — defineCollection 和 addCollection
- [Resource API 速查表](../../../api/flow-engine/resource.md) — MultiRecordResource / SingleRecordResource 的完整方法签名
- [Plugin 插件](../plugin) — 插件入口和 load() 生命周期
- [i18n 国际化](../component/i18n) — 翻译文件写法和 tExpr 用法
- [服务端 → ACL 权限控制](../../server/acl) — 权限配置
- [服务端 → Plugin 插件](../../server/plugin) — 服务端插件生命周期
- [Context → 常用能力](../ctx/common-capabilities) — ctx.viewer、ctx.message 等
- [Component 组件开发](../component/index.md) — Antd Form 等组件用法
- [FlowEngine 完整文档](../../../flow-engine/index.md) — FlowModel、Flow、Context 的完整参考
