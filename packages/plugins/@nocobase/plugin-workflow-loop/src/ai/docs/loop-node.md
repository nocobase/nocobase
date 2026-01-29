---
title: "循环"
description: "说明循环节点的循环目标、条件控制与分支入口规则。"
---

# 循环

## 节点类型

`loop`
请使用以上 `type` 值创建节点，不要使用文档文件名作为 type。

## 节点描述
对数组、字符串或指定次数进行循环处理，每次循环执行分支内节点。

## 业务场景举例
遍历订单明细逐条创建记录，可类比编程语言中的 for/foreach。

## 配置项列表
| 字段 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| target | any | 1 | 是 | 循环目标：数字表示次数，字符串按字符数组循环，其它值会转换为数组。可以使用上下文的变量。 |
| condition | object/boolean | false | 否 | 循环条件配置，启用后可在满足条件时继续或中断。见下方“条件结构”。 |
| exit | number | 0 | 否 | 分支内节点失败时处理方式：`0` 退出工作流，`1` 退出循环并继续流程，`2` 忽略失败继续下一项。 |

### 条件结构
当 `condition` 为对象时：

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| calculation | object | 无 | 条件表达式（基础逻辑计算结构，同 condition 节点的 `calculation`）。 |
| expression | string | 无 | 可选表达式（自定义引擎时使用）。 |
| engine | string | basic | 可选，引擎为 `math.js`/`formula.js` 时使用 `expression`。 |
| checkpoint | number | 0 | 何时检查：`0` 每次开始前，`1` 每次结束后。 |
| continueOnFalse | boolean | false | 条件不满足时是否继续下一项。 |

## 分支说明

- Loop nodes allow only one branch (the loop body).
- Use any non-null `branchIndex` value (0 is commonly used). Additional branches are not permitted.

## 示例配置
```json
{
  "target": "{{ $context.data.items }}",
  "condition": {
    "checkpoint": 0,
    "continueOnFalse": true,
    "calculation": {
      "group": {
        "type": "and",
        "calculations": [
          { "calculator": "notEqual", "operands": ["{{ $scopes.item.status }}", "skip"] }
        ]
      }
    }
  },
  "exit": 2
}
```