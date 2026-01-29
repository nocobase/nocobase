---
title: "通知"
description: "说明通知节点的消息配置与失败处理选项。"
---

# 通知

## 节点类型

`notification`
请使用以上 `type` 值创建节点，不要使用文档文件名作为 type。

## 节点描述
发送系统通知，可通过通知插件配置渠道、接收人和内容。

## 业务场景举例
当库存不足时发送站内通知给运营人员。

## 配置项列表
| 字段 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| message | object | 无 | 是 | 通知配置（由通知插件表单生成），包含 `channelName`、接收人、内容等。 |
| ignoreFail | boolean | false | 否 | 发送失败是否忽略并继续流程。 |

## 分支说明
不支持分支。

## 示例配置
```json
{
  "message": {
    "channelName": "in-app",
    "title": "提醒",
    "content": "{{ $context.data.title }}"
  },
  "ignoreFail": false
}
```