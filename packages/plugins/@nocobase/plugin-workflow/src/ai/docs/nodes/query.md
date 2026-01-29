---
title: "查询数据"
description: "说明查询数据节点的筛选、排序、分页与返回模式。"
---

# 查询数据

## 节点类型

`query`
请使用以上 `type` 值创建节点，不要使用文档文件名作为 type。

## 节点描述
按筛选条件查询数据表记录，可返回单条或多条结果。

## 业务场景举例
查询当前用户的订单列表或检查记录是否存在。

## 配置项列表
| 字段 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| collection | string | 无 | 是 | 目标数据表，单数据源时可直接写集合名，多数据源可写 `dataSource:collection`。 |
| multiple | boolean | false | 是 | 结果类型：`false` 返回单条记录或 `null`；`true` 返回数组。 |
| params.filter | object | 无 | 否 | 筛选条件，格式与数据表过滤器 DSL 一致。 |
| params.sort | array | [] | 否 | 排序规则数组，元素形如 `{ "field": "createdAt", "direction": "desc" }`。 |
| params.page | number | 1 | 否 | 页码。 |
| params.pageSize | number | 20 | 否 | 每页数量。 |
| params.appends | string[] | [] | 否 | 预加载关联字段列表。 |
| failOnEmpty | boolean | false | 否 | 查询结果为空时是否以失败状态退出。 |

## 分支说明
不支持分支。

## 示例配置
```json
{
  "collection": "posts",
  "multiple": true,
  "params": {
    "filter": {
      "$and": [
        { "status": { "$eq": "published" } }
      ]
    },
    "sort": [
      { "field": "createdAt", "direction": "desc" }
    ],
    "page": 1,
    "pageSize": 10,
    "appends": ["author"]
  },
  "failOnEmpty": false
}
```