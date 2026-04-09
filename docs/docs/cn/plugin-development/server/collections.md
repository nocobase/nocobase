---
title: "Collections 数据表定义"
description: "NocoBase 插件定义 Collection：defineCollection、extendCollection、fields、src/server/collections 目录约定。"
keywords: "Collections,defineCollection,extendCollection,数据表,Collection 定义,NocoBase"
---

# Collections 数据表

在 NocoBase 插件开发中，**Collection（数据表）** 是最核心的概念之一。你可以通过定义或扩展 Collection，在插件中新增或修改数据表结构。跟通过「数据源管理」界面创建的数据表不同，**代码定义的 Collection 通常来说是系统级的元数据表**，不会出现在数据源管理的列表中。

## 定义数据表

按照约定式目录结构，Collection 文件应放在 `./src/server/collections` 目录下。创建新表使用 `defineCollection()`，扩展已有表使用 `extendCollection()`。

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'articles',
  title: '示例文章',
  fields: [
    { type: 'string', name: 'title', interface: 'input', uiSchema: { title: '标题', required: true } },
    { type: 'text', name: 'content', interface: 'textarea', uiSchema: { title: '正文' } },
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
      interface: 'recordPicker',
      uiSchema: { title: '作者' },
    },
  ],
});
```

上面的示例中：

- `name`：表名（数据库中会自动生成同名表）。  
- `title`：该表在界面中的显示名称。  
- `fields`：字段集合，每个字段包含 `type`、`name` 等属性。  

当需要为其他插件的 Collection 增加字段或修改配置时，可以使用 `extendCollection()`：

```ts
import { extendCollection } from '@nocobase/database';

export default extendCollection({
  name: 'articles',
  fields: [
    {
      type: 'boolean',
      name: 'isPublished',
      defaultValue: false,
    },
  ],
});
```

激活插件后，系统会自动将 `isPublished` 字段添加到已有的 `articles` 表中。

:::tip 提示

约定式目录会在所有插件的 `load()` 方法执行前完成加载，从而避免部分数据表未载入导致的依赖问题。

:::

## 同步数据库结构

插件首次激活时，系统会自动将 Collection 配置与数据库结构同步。如果插件已安装并正在运行，在新增或修改 Collection 后需要手动执行升级命令：

```bash
yarn nocobase upgrade
```

如果同步过程中出现异常或脏数据，可以通过重新安装应用来重建表结构：

```bash
yarn nocobase install -f
```

## 让 Collection 出现在 UI 数据表列表中

通过 `defineCollection` 定义的表是服务端内部表，默认**不会出现**在「数据源管理」的列表中，也不会出现在「添加区块」时的数据表选择列表里。如果你的插件需要让用户在界面上选到这张表（比如添加区块时绑定数据表），需要在**客户端插件**的 `load()` 中通过 `addCollection` 手动注册：

![添加区块时能选中自己的](https://static-docs.nocobase.com/20260409143839.png)

```ts
// src/client-v2/plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class MyPlugin extends Plugin {
  async load() {
    const mainDS = this.flowEngine.dataSourceManager.getDataSource('main');
    mainDS?.addCollection({
      name: 'todoItems',
      title: 'Todo Items',
      // filterTargetKey 必须设置，否则不会出现在区块的数据表选择列表中
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
      ],
    });
  }
}
```

服务端的 `defineCollection` 负责创建物理表和 ORM 映射，客户端的 `addCollection` 负责让 UI 知道这张表的存在。两边配合才能实现前后端联动。完整示例见 [做一个前后端联动的数据管理插件](../client/examples/fullstack-plugin.md)。

## 自动生成资源（Resource）

定义 Collection 后，系统会自动为其生成对应的资源（Resource），你可以直接通过 API 对该资源执行增删改查操作。详见 [ResourceManager 资源管理](./resource-manager.md)。

## 相关链接

- [Database 数据库](./database.md) — CRUD、Repository、事务与数据库事件
- [DataSourceManager 数据源管理](./data-source-manager.md) — 管理多个数据源及其集合
- [Migration 数据迁移](./migration.md) — 插件升级时的数据迁移脚本
- [Plugin 插件](./plugin.md) — 插件类的生命周期、成员方法和 `app` 对象
- [项目目录结构](../project-structure.md) — `src/server/collections` 目录约定说明
