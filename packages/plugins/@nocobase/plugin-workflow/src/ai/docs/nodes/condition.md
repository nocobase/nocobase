---
title: "条件判断"
description: "说明条件判断节点的引擎选择、计算结构与分支规则。"
---

# 条件判断

## 节点类型

`condition`
请使用以上 `type` 值创建节点，不要使用文档文件名作为 type。

## 节点描述
根据条件判断结果决定流程走向：可以“条件为真才继续”，或按“是/否”分支继续。

## 业务场景举例
判断库存是否充足决定是否继续流程，可类比编程语言中的 if/else。

## 配置项列表
| 字段 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| rejectOnFalse | boolean | true | 是 | 模式选择。`true` 表示条件为真才继续，条件为假时以失败状态结束；`false` 表示开启“是/否”分支。 |
| engine | string | basic | 是 | 运算引擎：`basic`、`math.js`、`formula.js`。 |
| calculation | object | 无 | 是（engine=basic） | 当 `engine=basic` 时使用，逻辑计算配置，见下方“basic 结构说明”。 |
| expression | string | 无 | 是（engine!=basic） | 当 `engine` 非 `basic` 时使用的表达式。 |

### basic 结构说明
`calculation` 支持分组与嵌套：
- `calculation.group.type`: `and` 或 `or`
- `calculation.group.calculations`: 条件数组，元素可以是“计算项”或嵌套分组
- 计算项结构：`{ "calculator": string, "operands": [left, right] }`
- 内置 `calculator`：`equal`、`notEqual`、`gt`、`gte`、`lt`、`lte`、`includes`、`notIncludes`、`startsWith`、`notStartsWith`、`endsWith`、`notEndsWith`（也可扩展注册）

## 分支说明
- `rejectOnFalse=true` 时不产生分支，下游节点 `branchIndex` 应为 `null`。
- `rejectOnFalse=false` 时开启分支：
  - `branchIndex=1`：条件为真（Yes）
  - `branchIndex=0`：条件为假（No）

## 示例配置
```json
{
  "rejectOnFalse": false,
  "engine": "basic",
  "calculation": {
    "group": {
      "type": "and",
      "calculations": [
        {
          "calculator": "equal",
          "operands": ["{{ $context.data.status }}", "approved"]
        }
      ]
    }
  }
}
```