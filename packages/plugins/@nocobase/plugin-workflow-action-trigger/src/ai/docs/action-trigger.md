---
title: "操作后事件"
description: "在用户操作（创建/更新）完成后触发流程，适合处理带用户上下文的数据操作。"
---

# 操作后事件

## 触发器类型

`action`
请使用以上 `type` 值创建触发器，不要使用文档文件名作为 type。

## 适用场景
- 需要在用户操作完成后立即执行流程（例如创建/更新后的通知、审批、同步）。
- 需要流程上下文包含操作者信息（用户与角色）。

## 触发时机 / 事件
- 监听应用内的操作请求（Koa 中间件层），当前主要包含 `create` / `update` 操作。
- **局部模式**：仅在绑定了该工作流的按钮/操作触发。
- **全局模式**：对选定的数据表与操作类型，所有操作均触发。

## 配置项列表
| 字段 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| collection | string | - | 是 | 触发数据所在数据表，格式为 `"<dataSource>.<collection>"`。 |
| global | boolean | false | 是 | 触发模式：`false` 局部模式（需绑定），`true` 全局模式（按 actions 生效）。 |
| actions | string[] | - | 仅全局模式必填 | 全局模式下允许触发的操作类型，目前支持：`"create"`、`"update"`。 |
| appends | string[] | [] | 否 | 预加载关联字段路径，用于补充触发数据。 |

## 触发器变量
- `$context.data`：触发的数据记录（必要时会按 `appends` 预加载）。
- `$context.user`：触发操作的用户（脱敏后的用户信息）。
- `$context.roleName`：触发操作的用户角色名称。

## 示例配置
```json
{
  "collection": "main.posts",
  "global": true,
  "actions": ["create", "update"],
  "appends": ["category", "author"]
}
```