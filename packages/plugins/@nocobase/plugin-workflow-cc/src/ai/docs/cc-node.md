---
title: "抄送"
description: "说明抄送节点的接收人配置与通知使用方式。"
---

# 抄送

## 节点类型

`cc`
请使用以上 `type` 值创建节点，不要使用文档文件名作为 type。

## 节点描述
向指定用户发送抄送任务/通知，用于仅查看或知会。

## 业务场景举例
审批完成后抄送给相关负责人知会。

## 配置项列表
| 字段 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| users | array | [] | 是 | 接收人列表。元素可为用户 ID，或用户筛选条件对象（filter 结构）。 |
| ccDetail | string | 无 | 是 | 抄送详情界面配置 UID（由 UI 生成）。 |
| title | string | 节点标题 | 否 | 任务标题，支持变量模板。 |
| notifications | array | [] | 否 | 通知配置（由 UI 生成）。 |

## 分支说明
不支持分支。

## 示例配置
```json
{
  "users": ["{{ $context.data.ownerId }}"],
  "ccDetail": "cc-ui-uid",
  "title": "{{ $context.data.title }} - 抄送"
}
```