---
title: "更新数据"
description: "说明更新数据节点的筛选条件、更新模式与配置示例。"
---

# 更新数据

## 节点类型

`update`
请使用以上 `type` 值创建节点，不要使用文档文件名作为 type。

## 节点描述
按筛选条件更新数据表中的记录，可选择批量或逐条更新。

## 业务场景举例
订单支付成功后更新状态与时间字段。

## 配置项列表
| 字段 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| collection | string | 无 | 是 | 目标数据表，单数据源时可直接写集合名，多数据源可写 `dataSource:collection`。 |
| usingAssignFormSchema | boolean | true | 否 | 是否使用自定义赋值表单（主要影响前端配置展示）。 |
| assignFormSchema | object | {} | 否 | 自定义赋值表单的 UI Schema（主要供前端使用）。 |
| params.individualHooks | boolean | false | 否 | 更新模式：`false` 批量更新；`true` 逐条更新（会触发记录级钩子/工作流）。 |
| params.filter | object | 无 | 是 | 筛选条件（至少包含一个条件）。 |
| params.values | object | {} | 否 | 字段赋值对象，键为字段名，值可为常量或变量；至少应包含一个要更新的字段。 |

## 分支说明
不支持分支。

## 示例配置
```json
{
  "collection": "posts",
  "usingAssignFormSchema": false,
  "assignFormSchema": {},
  "params": {
    "individualHooks": true,
    "filter": {
      "$and": [
        { "id": { "$eq": "{{ $context.data.id }}" } }
      ]
    },
    "values": {
      "status": "published"
    }
  }
}
```