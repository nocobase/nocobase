---
title: "新增数据"
description: "说明新增数据节点的目标集合与字段赋值方式。"
---

# 新增数据

## 节点类型

`create`
请使用以上 `type` 值创建节点，不要使用文档文件名作为 type。

## 节点描述
向指定数据表新增一条记录，可使用流程上下文变量为字段赋值。

## 业务场景举例
提交订单后新增订单日志或关联记录。

## 配置项列表
| 字段 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| collection | string | 无 | 是 | 目标数据表，格式与数据源选择器一致，单数据源时可直接写集合名（如 `posts`），多数据源可写 `dataSource:collection`。 |
| usingAssignFormSchema | boolean | true | 否 | 是否使用自定义赋值表单（主要影响前端配置展示）。 |
| assignFormSchema | object | {} | 否 | 自定义赋值表单的 UI Schema（主要供前端使用）。 |
| params.values | object | {} | 否 | 字段赋值对象，键为字段名，值可为常量或变量。未赋值字段将使用默认值或 `null`。 |
| params.appends | string[] | [] | 否 | 预加载关联字段列表，用于将关系数据一并写入节点结果。 |

## 分支说明
不支持分支。

## 示例配置
```json
{
  "collection": "posts",
  "usingAssignFormSchema": false,
  "assignFormSchema": {},
  "params": {
    "values": {
      "title": "自动生成",
      "status": "draft",
      "author_id": "{{ $context.user.id }}"
    },
    "appends": ["author"]
  }
}
```