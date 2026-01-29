---
title: "删除数据"
description: "介绍删除数据节点的筛选条件与配置要点。"
---

# 删除数据

## 节点类型

`destroy`
请使用以上 `type` 值创建节点，不要使用文档文件名作为 type。

## 节点描述
按筛选条件删除数据表中的记录。

## 业务场景举例
定期清理已取消的历史记录。

## 配置项列表
| 字段 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| collection | string | 无 | 是 | 目标数据表，单数据源时可直接写集合名，多数据源可写 `dataSource:collection`。 |
| params.filter | object | 无 | 是 | 筛选条件（至少包含一个条件）。格式与数据表过滤器 DSL 一致。 |

## 分支说明
不支持分支。

## 示例配置
```json
{
  "collection": "orders",
  "params": {
    "filter": {
      "$and": [
        { "status": { "$eq": "canceled" } }
      ]
    }
  }
}
```