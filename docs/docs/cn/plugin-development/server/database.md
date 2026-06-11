---
title: "Database 数据库"
description: "NocoBase Database：Collection、Model、Repository、FieldType、FilterOperator、dataSource.db、app.db。"
keywords: "Database,Collection,Model,Repository,Sequelize,dataSource.db,NocoBase"
---

# Database 数据库

`Database` 是数据库类型数据源（`DataSource`）的核心组成部分。每个数据库类型的数据源都有一个对应的 `Database` 实例，可以通过 `dataSource.db` 访问。主数据源的数据库实例还有一个便捷的别名 `app.db`。熟悉 `db` 的常用方法，是写服务端插件的基础。

## Database 组成部分

一个典型的 `Database` 由以下部分组成：

- **Collection**：定义数据表结构。
- **Model**：对应 ORM 的模型（通常由 Sequelize 管理）。
- **Repository**：封装数据访问逻辑的仓库层，提供更高级的操作方法。
- **FieldType**：字段类型。
- **FilterOperator**：用于筛选的操作符。
- **Event**：生命周期事件和数据库事件。

## 插件中的使用时机

### 在 beforeLoad 阶段适合做的事情

这个阶段还不能做数据库操作，适合做静态类的注册或事件监听。

- `db.registerFieldTypes()` — 注册自定义字段类型
- `db.registerModels()` — 注册自定义模型类
- `db.registerRepositories()` — 注册自定义仓库类
- `db.registerOperators()` — 注册自定义筛选操作符
- `db.on()` — 监听数据库相关事件

### 在 load 阶段适合做的事情

这个阶段所有前置的类定义和事件已经加载完毕，再加载数据表就不会有缺失或遗漏。

- `db.defineCollection()` — 定义新的数据表
- `db.extendCollection()` — 扩展已有数据表配置

不过如果是定义插件的内置表，更推荐放在 `./src/server/collections` 目录里，详见 [Collections 数据表](./collections.md)。

## 数据操作

`Database` 提供两种主要方式访问和操作数据：

### 通过 Repository 操作

```ts
const repo = db.getRepository('users');
const user = await repo.findOne({ filter: { id: 1 } });
```

Repository 层通常来说用于封装业务逻辑，比如分页、过滤、权限检查等。

### 通过 Model 操作

```ts
const UserModel = db.getModel('users');
const user = await UserModel.findByPk(1);
```

Model 层直接对应 ORM 实体，适合执行较底层的数据库操作。

## 哪些阶段可以进行数据库操作？

### Plugin 生命周期

| 阶段 | 可进行数据库操作 |
|------|----------------|
| `staticImport` | No |
| `afterAdd` | No |
| `beforeLoad` | No |
| `load` | No |
| `install` | Yes |
| `beforeEnable` | Yes |
| `afterEnable` | Yes |
| `beforeDisable` | Yes |
| `afterDisable` | Yes |
| `remove` | Yes |
| `handleSyncMessage` | Yes |

### App 事件

| 阶段 | 可进行数据库操作 |
|------|----------------|
| `beforeLoad` | No |
| `afterLoad` | No |
| `beforeStart` | Yes |
| `afterStart` | Yes |
| `beforeInstall` | No |
| `afterInstall` | Yes |
| `beforeStop` | Yes |
| `afterStop` | No |
| `beforeDestroy` | Yes |
| `afterDestroy` | No |
| `beforeLoadPlugin` | No |
| `afterLoadPlugin` | No |
| `beforeEnablePlugin` | Yes |
| `afterEnablePlugin` | Yes |
| `beforeDisablePlugin` | Yes |
| `afterDisablePlugin` | Yes |
| `afterUpgrade` | Yes |

### Database 事件/钩子

| 阶段 | 可进行数据库操作 |
|------|----------------|
| `beforeSync` | No |
| `afterSync` | Yes |
| `beforeValidate` | Yes |
| `afterValidate` | Yes |
| `beforeCreate` | Yes |
| `afterCreate` | Yes |
| `beforeUpdate` | Yes |
| `afterUpdate` | Yes |
| `beforeSave` | Yes |
| `afterSave` | Yes |
| `beforeDestroy` | Yes |
| `afterDestroy` | Yes |
| `afterCreateWithAssociations` | Yes |
| `afterUpdateWithAssociations` | Yes |
| `afterSaveWithAssociations` | Yes |
| `beforeDefineCollection` | No |
| `afterDefineCollection` | No |
| `beforeRemoveCollection` | No |
| `afterRemoveCollection` | No |

## 相关链接

- [Collections 数据表](./collections.md) — 用代码定义或扩展数据表结构
- [DataSourceManager 数据源管理](./data-source-manager.md) — 管理多个数据源及其数据库实例
- [Context 请求上下文](./context.md) — 在请求中获取 `db` 实例
- [Plugin 插件](./plugin.md) — 插件类的生命周期、成员方法和 `app` 对象
- [Event 事件](./event.md) — 应用级和数据库级的事件监听与处理
