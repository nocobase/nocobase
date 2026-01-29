---
title: "数据表事件"
description: "监听指定数据表的新增/更新/删除并触发流程，触发数据写入 $context.data。"
---

# 数据表事件

## 触发器类型

`collection`
请使用以上 `type` 值创建触发器，不要使用文档文件名作为 type。

## 适用场景
- 需要在数据表记录新增、更新或删除后执行自动化流程（如库存扣减、状态同步）。
- 希望基于数据变动本身触发，而非某个具体的按钮或 HTTP 请求。

## 触发时机 / 事件
- 监听指定数据表的数据变动事件：新增、更新、删除。
- 仅应用内的数据操作会触发（HTTP API 调用也属于应用内操作）。直接在数据库层写入不会触发。

## 配置项列表
| 字段 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| collection | string | - | 是 | 触发数据所在数据表，格式为 `"<dataSource>:<collection>"`（如 `"main:posts"`），数据源为主数据源时可省略 `dataSource`。 |
| mode | number | - | 是 | 触发时机位图：`1` 新增、`2` 更新、`3` 新增或更新、`4` 删除。 |
| changed | string[] | [] | 否 | 仅在包含更新时生效。选择字段后，仅当这些字段发生变化时触发；为空表示任意字段变化均触发。 |
| condition | object | null | 否 | 仅对新增/更新生效的过滤条件（Filter 语法）。满足条件时才触发。 |
| appends | string[] | [] | 否 | 需要预加载的关联字段路径（如 `"category"`、`"author.profile"`）。删除事件不加载关联。 |

## 触发器变量
- `$context.data`：触发的数据记录。
  - 新增/更新：为最新记录快照，包含 `appends` 预加载的关联数据。
  - 删除：为删除前的数据快照，不加载 `appends`。

## 示例配置
```json
{
  "collection": "main.posts",
  "mode": 3,
  "changed": ["status", "title"],
  "condition": {
    "status": {
      "$ne": "archived"
    }
  },
  "appends": ["category", "author"]
}
```