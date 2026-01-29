---
title: "聚合查询"
description: "介绍聚合查询节点的用途、关键配置字段与示例。"
---

# 聚合查询

## 节点类型

`aggregate`
请使用以上 `type` 值创建节点，不要使用文档文件名作为 type。

## 节点描述
对指定数据表（或关联数据）执行聚合计算，支持计数、求和、平均、最小、最大。

## 业务场景举例
统计订单数量、求和金额或计算平均评分。

## 配置项列表
| 字段 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| aggregator | string | count | 是 | 聚合函数：`count`、`sum`、`avg`、`min`、`max`。 |
| associated | boolean | false | 是 | 目标类型：`false` 表示集合数据，`true` 表示关联集合数据。 |
| collection | string | 无 | 是（associated=false） | 目标数据表，单数据源可写集合名，多数据源写 `dataSource:collection`。 |
| association | object | 无 | 是（associated=true） | 关联配置对象，包含 `name`（关联字段名）、`associatedKey`（关联主键变量路径）、`associatedCollection`（源集合名）。通常由 UI 生成。 |
| params.field | string | 无 | 是 | 要聚合的字段名。 |
| params.filter | object | 无 | 否 | 筛选条件（过滤器 DSL）。 |
| params.distinct | boolean | false | 否 | 仅在 `count` 时生效，是否去重计数。 |
| precision | number | 2 | 否 | 结果小数位数，范围 0-14。 |

## 分支说明
不支持分支。

## 示例配置
```json
{
  "aggregator": "count",
  "associated": false,
  "collection": "orders",
  "params": {
    "field": "id",
    "filter": {
      "status": { "$eq": "paid" }
    },
    "distinct": true
  },
  "precision": 2
}
```