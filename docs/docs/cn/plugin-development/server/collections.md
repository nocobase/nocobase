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

## 字段类型速查

`defineCollection` 的 `fields` 中，`type` 决定了字段在数据库中的列类型。以下是所有内置字段类型：

### 文本

| type | 数据库类型 | 说明 | 特有参数 |
|------|-----------|------|----------|
| `string` | VARCHAR(255) | 短文本 | `length?: number`（自定义长度）, `trim?: boolean` |
| `text` | TEXT | 长文本 | `length?: 'tiny' \| 'medium' \| 'long'`（仅 MySQL） |

### 数字

| type | 数据库类型 | 说明 | 特有参数 |
|------|-----------|------|----------|
| `integer` | INTEGER | 整数 | — |
| `bigInt` | BIGINT | 大整数 | — |
| `float` | FLOAT | 浮点数 | — |
| `double` | DOUBLE | 双精度浮点 | — |
| `decimal` | DECIMAL(p,s) | 定点数 | `precision: number`, `scale: number` |

### 布尔

| type | 数据库类型 | 说明 |
|------|-----------|------|
| `boolean` | BOOLEAN | 布尔值 |

### 日期时间

| type | 数据库类型 | 说明 | 特有参数 |
|------|-----------|------|----------|
| `date` | DATE(3) | 日期时间（带毫秒） | `defaultToCurrentTime?`, `onUpdateToCurrentTime?` |
| `dateOnly` | DATEONLY | 仅日期，无时间 | — |
| `time` | TIME | 仅时间 | — |
| `unixTimestamp` | BIGINT | Unix 时间戳 | `accuracy?: 'second' \| 'millisecond'` |

:::tip 提示

`date` 是最常用的日期类型。如果需要区分时区处理方式，还有 `datetimeTz`（带时区）和 `datetimeNoTz`（不带时区）可选。

:::

### 结构化数据

| type | 数据库类型 | 说明 | 特有参数 |
|------|-----------|------|----------|
| `json` | JSON / JSONB | JSON 数据 | `jsonb?: boolean`（PostgreSQL 下使用 JSONB） |
| `jsonb` | JSONB / JSON | 优先使用 JSONB | — |
| `array` | ARRAY / JSON | 数组 | PostgreSQL 下可用原生 ARRAY 类型 |

### ID 生成

| type | 数据库类型 | 说明 | 特有参数 |
|------|-----------|------|----------|
| `uid` | VARCHAR(255) | 自动生成短 ID | `prefix?: string` |
| `uuid` | UUID | UUID v4 | `autoFill?: boolean`（默认 true） |
| `nanoid` | VARCHAR(255) | NanoID | `size?: number`（默认 12）, `customAlphabet?: string` |
| `snowflakeId` | BIGINT | 雪花 ID | `autoFill?: boolean`（默认 true） |

### 特殊类型

| type | 数据库类型 | 说明 |
|------|-----------|------|
| `password` | VARCHAR(255) | 自动加盐哈希存储 |
| `virtual` | 无实际列 | 虚拟字段，不在数据库中创建列 |
| `context` | 可配置 | 从请求上下文自动填充（比如 `currentUser.id`） |

### 关联类型

关联字段不创建数据库列，而是在 ORM 层建立表间关系：

| type | 说明 | 关键参数 |
|------|------|----------|
| `belongsTo` | 多对一 | `target`（目标表）, `foreignKey`（外键字段） |
| `hasOne` | 一对一 | `target`, `foreignKey` |
| `hasMany` | 一对多 | `target`, `foreignKey` |
| `belongsToMany` | 多对多 | `target`, `through`（中间表）, `foreignKey`, `otherKey` |

关联字段的用法示例：

```ts
export default defineCollection({
  name: 'articles',
  fields: [
    { type: 'string', name: 'title' },
    // 多对一：文章属于一个作者
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
    },
    // 一对多：文章有多条评论
    {
      type: 'hasMany',
      name: 'comments',
      target: 'comments',
      foreignKey: 'articleId',
    },
    // 多对多：文章有多个标签
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags',
      through: 'articlesTags',  // 中间表名
    },
  ],
});
```

### 公共参数

所有列字段都支持以下参数：

| 参数 | 类型 | 说明 |
|------|------|------|
| `name` | `string` | 字段名（必填） |
| `defaultValue` | `any` | 默认值 |
| `allowNull` | `boolean` | 是否允许 null |
| `unique` | `boolean` | 是否唯一 |
| `primaryKey` | `boolean` | 是否主键 |
| `autoIncrement` | `boolean` | 是否自增 |
| `index` | `boolean` | 是否建索引 |
| `comment` | `string` | 字段注释 |

## 同步数据库结构

插件首次激活时，系统会自动将 Collection 配置与数据库结构同步。如果插件已安装并正在运行，在新增或修改 Collection 后需要手动执行升级命令：

```bash
yarn nocobase upgrade
```

如果同步过程中出现异常或脏数据，可以通过重新安装应用来重建表结构：

```bash
yarn nocobase install -f
```

如果插件升级时需要对已有数据做迁移——比如重命名字段、拆分表、回填默认值等——应该通过 [Migration 升级脚本](./migration.md) 来处理，而不是手动改数据库。

## 让 Collection 出现在 UI 数据表列表中

通过 `defineCollection` 定义的表是服务端内部表，默认**不会出现**在「数据源管理」的列表中，也不会出现在「添加区块」时的数据表选择列表里。

**推荐做法**：在 NocoBase 界面的「[数据源管理](../../data-sources/data-source-main/index.md)」中添加对应的数据表，配置好字段和接口类型后，表就会自动出现在区块的数据表选择列表里。

![添加区块时能选中自己的](https://static-docs.nocobase.com/20260409143839.png)

如果确实需要在插件代码里注册（比如示例插件里的演示场景），可以在客户端插件里通过 `addCollection` 手动注册。注意必须通过 `eventBus` 模式注册，不能直接在 `load()` 里调用——`ensureLoaded()` 会在 `load()` 之后清空并重新设置所有 collection。完整示例见 [做一个前后端联动的数据管理插件](../client/examples/fullstack-plugin.md)。

## 自动生成资源（Resource）

定义 Collection 后，NocoBase 会自动为其生成对应的 REST API 资源，开箱即用的增删改查接口（`list`、`get`、`create`、`update`、`destroy`）不需要额外编写。如果内置的 CRUD 操作不够用——比如你需要一个"批量导入"或"统计汇总"接口——可以通过 `resourceManager` 注册自定义 action。详见 [ResourceManager 资源管理](./resource-manager.md)。

## 相关链接

- [Database 数据库](./database.md) — CRUD、Repository、事务与数据库事件
- [DataSourceManager 数据源管理](./data-source-manager.md) — 管理多个数据源及其集合
- [Migration 数据迁移](./migration.md) — 插件升级时的数据迁移脚本
- [Plugin 插件](./plugin.md) — 插件类的生命周期、成员方法和 `app` 对象
- [ResourceManager 资源管理](./resource-manager.md) — 自定义 REST API 和操作处理器
- [做一个前后端联动的数据管理插件](../client/examples/fullstack-plugin.md) — defineCollection + addCollection 的完整示例
- [项目目录结构](../project-structure.md) — `src/server/collections` 目录约定说明
