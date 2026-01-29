---
title: "SQL 操作"
description: "介绍 SQL 节点的数据源、语句执行与返回结构。"
---

# SQL 操作

## 节点类型

`sql`
请使用以上 `type` 值创建节点，不要使用文档文件名作为 type。

## 节点描述
在数据库数据源上执行 SQL 语句并返回结果。

## 业务场景举例
执行统计 SQL 或批量修正数据。

## 配置项列表
| 字段 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| dataSource | string | main | 是 | 数据源 key，必须为数据库类型数据源。 |
| sql | string | 无 | 是 | SQL 语句，支持变量模板。 |
| withMeta | boolean | false | 否 | 是否返回元信息（返回 `[result, meta]`）。 |

## 分支说明
不支持分支。

## 示例配置
```json
{
  "dataSource": "main",
  "sql": "SELECT COUNT(*) AS total FROM orders WHERE status = 'paid'",
  "withMeta": false
}
```