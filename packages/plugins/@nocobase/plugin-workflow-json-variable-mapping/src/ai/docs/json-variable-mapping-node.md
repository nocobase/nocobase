---
title: "JSON 变量映射"
description: "说明 JSON 变量映射节点的路径解析与变量输出方式。"
---

# JSON 变量映射

## 节点类型

`json-variable-mapping`
请使用以上 `type` 值创建节点，不要使用文档文件名作为 type。

## 节点描述
将任意 JSON 数据解析为结构化变量，供后续节点引用。

## 业务场景举例
将 webhook 的原始 JSON 映射成清晰变量供后续节点使用。

## 配置项列表
| 字段 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| dataSource | any | 无 | 是 | JSON 数据源（变量或常量）。 |
| example | object/array | 无 | 否 | JSON 示例，仅用于 UI 解析生成映射项。 |
| parseArray | boolean | false | 否 | 是否将数组索引纳入路径（如 `items.0`）。 |
| variables | array | [] | 否 | 映射项列表，通常由解析按钮生成。 |
| variables[].path | string | 无 | 是 | JSON 路径。 |
| variables[].alias | string | 无 | 否 | 映射别名（显示用）。 |
| variables[].key | string | 无 | 否 | 输出变量键（由 UI 生成的唯一 key）。 |

## 分支说明
不支持分支。

## 示例配置
```json
{
  "dataSource": "{{ $context.data.payload }}",
  "parseArray": true,
  "variables": [
    { "path": "user.id", "alias": "用户ID", "key": "user_id" },
    { "path": "items.0.name", "alias": "首项名称", "key": "first_item_name" }
  ]
}
```