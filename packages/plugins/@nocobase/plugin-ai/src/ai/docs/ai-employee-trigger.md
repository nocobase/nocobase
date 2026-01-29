---
title: "AI 员工事件"
description: "由 AI 员工通过工具调用触发流程，参数作为上下文变量传入。"
---

# AI 员工事件

## 触发器类型

`ai-employee`
请使用以上 `type` 值创建触发器，不要使用文档文件名作为 type。

## 适用场景
- 将工作流作为 AI 员工可调用的工具（Tool）。
- 需要根据 AI 传入的参数执行流程（如创建记录、调用接口等）。

## 触发时机 / 事件
- AI 员工在对话中调用该工作流工具时触发。
- 该触发器为同步执行模式。

## 配置项列表
| 字段 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| parameters | object[] | [] | 是 | AI 工具参数定义列表。 |
| parameters[].name | string | - | 是 | 参数名称（仅允许字母或下划线）。 |
| parameters[].type | string | - | 是 | 参数类型：`string`、`number`、`boolean`、`enum`。 |
| parameters[].description | string | - | 否 | 参数说明。 |
| parameters[].enumOptions | string[] | [] | 仅 type=enum 必填 | 枚举可选值列表。 |
| parameters[].required | boolean | false | 否 | 是否必填。 |

## 触发器变量
- `$context.<paramName>`：AI 员工调用时传入的参数值。

## 示例配置
```json
{
  "parameters": [
    {
      "name": "action",
      "type": "enum",
      "enumOptions": ["create", "update"],
      "required": true,
      "description": "要执行的操作类型"
    },
    {
      "name": "recordId",
      "type": "number",
      "required": false,
      "description": "记录 ID"
    }
  ]
}
```