---
title: "JSON 计算"
description: "说明 JSON 查询节点的引擎选择、表达式与结果映射配置。"
---

# JSON 计算

## 节点类型

`json-query`
请使用以上 `type` 值创建节点，不要使用文档文件名作为 type。

## 节点描述
使用 JSON 查询引擎对复杂 JSON 数据进行筛选、转换或计算。

## 业务场景举例
从第三方响应中提取字段、重组 JSON 结构。

## 配置项列表
| 字段 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| engine | string | jmespath | 是 | 查询引擎：`jmespath`、`jsonpathplus`、`jsonata`。 |
| source | any | 无 | 是 | JSON 数据源（变量或常量）。 |
| expression | string | 无 | 是 | 查询表达式，语法由 `engine` 决定。 |
| model | array | [] | 否 | 结果映射规则，仅当结果为对象或对象数组时生效。 |
| model[].path | string | 无 | 是 | 取值路径（点号路径）。 |
| model[].alias | string | 无 | 否 | 字段别名，默认使用 `path`，点号会转为下划线。 |
| model[].label | string | 无 | 否 | 显示名称（用于变量树展示）。 |

## 分支说明
不支持分支。

## 示例配置
```json
{
  "engine": "jmespath",
  "source": "{{ $context.data }}",
  "expression": "items[?status=='ok']",
  "model": [
    { "path": "id", "alias": "item_id", "label": "ID" },
    { "path": "name", "label": "名称" }
  ]
}
```