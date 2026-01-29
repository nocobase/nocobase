---
title: "多条件分支"
description: "说明多条件分支节点的条件列表、否则分支与继续规则。"
---

# 多条件分支

## 节点类型

`multi-conditions`
请使用以上 `type` 值创建节点，不要使用文档文件名作为 type。

## 节点描述
按配置顺序依次判断多个条件，满足即进入对应分支，未满足则继续判断；若均不满足则进入“否则”分支。

## 业务场景举例
根据状态/等级选择不同处理分支，可类比 switch/case 或 if-else if。

## 配置项列表
| 字段 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| conditions | array | 无 | 是 | 条件分支列表，按数组顺序对应分支顺序。每项结构见下方“conditions 项结构”。 |
| continueOnNoMatch | boolean | false | 否 | 所有条件均不满足时，是否在“否则”分支执行完后继续后续节点。`false` 表示以失败结束。 |

### conditions 项结构
| 字段 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| uid | string | 无 | 否 | 条件分支唯一标识，主要用于前端展示，建议提供。 |
| title | string | 无 | 否 | 条件分支标题，未设置时默认显示“条件 X”。 |
| engine | string | basic | 是 | 运算引擎：`basic`、`math.js`、`formula.js`。 |
| calculation | object | 无 | 是（engine=basic） | 当 `engine=basic` 时使用，结构同 Condition 节点的 `calculation`。 |
| expression | string | 无 | 是（engine!=basic） | 当 `engine` 非 `basic` 时使用的表达式。 |

## 分支说明

- Branch indexes:
  - `branchIndex = 0` reserved for the "otherwise" branch.
  - Positive integers (`1..n`) correspond to each condition block in left-to-right order.
- Each branchIndex value can appear at most once.
- When adding a new condition branch, pick the next integer after the current maximum.

## 示例配置
```json
{
  "conditions": [
    {
      "uid": "c1",
      "title": "已审核",
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
    },
    {
      "uid": "c2",
      "title": "金额大于 1000",
      "engine": "math.js",
      "expression": "{{ $context.data.amount }} > 1000"
    }
  ],
  "continueOnNoMatch": true
}
```