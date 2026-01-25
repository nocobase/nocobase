# Collections 数据表

在 NocoBase 插件开发中，**Collection（数据表）** 是最核心的概念之一。你可以通过定义或扩展 Collection，在插件中新增或修改数据表结构。与通过数据源管理界面创建的数据表不同，**代码定义的 Collection 通常是系统级的元数据表**，不会出现在数据源管理的列表中。

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

:::tip
约定式目录会在所有插件的 `load()` 方法执行前完成加载，从而避免部分数据表未载入导致的依赖问题。
:::

## 同步数据库结构

插件首次激活时，系统会自动将 Collection 配置与数据库结构同步。如果插件已安装并正在运行，在新增或修改 Collection 后需要手动执行升级命令：

```bash
yarn nocobase upgrade
```

若同步过程中出现异常或脏数据，可通过重新安装应用来重建表结构：

```bash
yarn nocobase install -f
```

## 自动生成资源（Resource）

定义 Collection 后，系统会自动为其生成对应的资源（Resource），可以直接通过 API 对该资源执行增删改查操作。详见 [资源管理](./resource-manager.md)。

