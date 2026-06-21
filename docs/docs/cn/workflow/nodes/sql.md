---
pkg: '@nocobase/plugin-workflow-sql'
title: "工作流节点 - SQL 操作"
description: "SQL 操作节点：执行复杂 SQL 语句，支持流程上下文变量作为参数。"
keywords: "工作流,SQL 操作,数据库,SQL 语句,变量参数,NocoBase"
---

# SQL 操作

## 介绍

在一些特殊场景里，上面简单的数据表操作节点可能无法复杂的操作，则可以直接使用 SQL 节点，使数据库直接执行复杂的 SQL 语句进行数据操作。

与在应用外部直接连接数据库进行 SQL 操作的区别是，在工作流内可以使用流程上下文的变量，作为 SQL 语句中的部分参数。

## 安装

内置插件，无需安装。

## 创建节点

在工作流配置界面中，点击流程中的加号（“+”）按钮，添加“SQL 操作”节点：

![SQL 操作_添加](https://static-docs.nocobase.com/0ce40a226d7a5bf3717813e27da40e62.png)

## 节点配置

![SQL节点_节点配置](https://static-docs.nocobase.com/20260414235136.png)

### 数据源

选择执行 SQL 的数据源。

数据源必须是数据库类型的，例如主数据源、PostgreSQL 类型等基于 Sequelize 兼容的数据源。

### SQL 内容

编辑 SQL 语句。目前仅支持一条 SQL 语句。

:::info
自 `v2.0.30` 起，基于安全原因，SQL 语句中不再支持直接使用变量进行文本替换的方式，需要改用参数化查询。
:::

SQL 语句中可以使用流程上下文的变量，但需要使用 `:variableName` 的形式进行占位，例如：

```sql
SELECT * FROM users WHERE id = :userId;
```

### 参数列表

在上述 SQL 语句中，`:userId` 就是一个占位符，占位符的替换需要在“参数列表”中进行配置。变量名称使用占位符中的名称，例如 `userId`，变量值可以使用变量选择工具选择流程上下文的变量。

## 节点执行结果

自 `v1.3.15-beta` 起，SQL 节点执行的结果为一个纯数据组成的数组，在此之前是 Sequelize 原生返回包含查询元信息的结构（详见：[`sequelize.query()`](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-query)）。

例如以下查询：

```sql
select count(id) from posts;
```

在 `v1.3.15-beta` 之前的结果：

```json
[
    [
        { "count": 1 }
    ],
    {
        // meta
    }
]
```

在 `v1.3.15-beta` 之后的结果：

```json
[
    { "count": 1 }
]
```

## 常见问题

### SQL 节点的结果如何使用？

如果使用了 `SELECT` 语句，查询结果会以 Seqeulize 的 JSON 格式保存在节点中，可以通过 [JSON-query](./json-query.md) 插件进行解析并使用。

### SQL 操作是否会触发数据表事件？

**不会**。SQL 操作是直接将 SQL 语句发送到数据库进行处理，相关的 `CREATE` / `UPDATE` / `DELETE` 操作都发生在数据库中，而数据表事件发生在 Node.js 的应用层（ORM 处理），所以不会触发数据表的事件。
