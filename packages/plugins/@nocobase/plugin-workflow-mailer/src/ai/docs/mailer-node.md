---
title: "邮件发送"
description: "介绍邮件发送节点的 SMTP 配置、收发件人及内容字段。"
---

# 邮件发送

## 节点类型

`mailer`
请使用以上 `type` 值创建节点，不要使用文档文件名作为 type。

## 节点描述
通过 SMTP 发送邮件，可使用上游变量配置收件人、主题和内容。

## 业务场景举例
订单完成后给客户发送确认邮件。

## 配置项列表
| 字段 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| provider.host | string | 无 | 是 | SMTP 主机。 |
| provider.port | number | 465 | 是 | SMTP 端口。 |
| provider.secure | boolean | true | 是 | 是否使用 TLS。 |
| provider.auth.user | string | 无 | 否 | SMTP 账号。 |
| provider.auth.pass | string | 无 | 否 | SMTP 密码。 |
| from | string | 无 | 是 | 发件人（如 `noreply <a@b.com>`）。 |
| to | array | [] | 是 | 收件人列表（数组元素为邮箱地址或变量）。 |
| cc | array | [] | 否 | 抄送列表。 |
| bcc | array | [] | 否 | 密送列表。 |
| subject | string | 无 | 否 | 邮件标题。 |
| contentType | string | html | 否 | 内容类型：`html` 或 `text`。 |
| html | string | 无 | 否 | HTML 内容（当 `contentType=html`）。 |
| text | string | 无 | 否 | 文本内容（当 `contentType=text`）。 |
| ignoreFail | boolean | false | 否 | 发送失败是否忽略并继续流程。 |

## 分支说明
不支持分支。

## 示例配置
```json
{
  "provider": {
    "host": "smtp.example.com",
    "port": 465,
    "secure": true,
    "auth": {
      "user": "noreply@example.com",
      "pass": "********"
    }
  },
  "from": "noreply <noreply@example.com>",
  "to": ["{{ $context.data.email }}"],
  "subject": "欢迎",
  "contentType": "text",
  "text": "你好，欢迎使用 NocoBase",
  "ignoreFail": false
}
```