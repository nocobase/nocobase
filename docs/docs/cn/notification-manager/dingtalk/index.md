---
pkg: '@nocobase/plugin-auth-dingtalk'
---

# 通知：钉钉

## 介绍

**钉钉**插件支持通过钉钉开放平台向已绑定钉钉账号的系统用户发送**工作通知**。

## 前置条件

1. 已安装并启用 `@nocobase/plugin-auth-dingtalk`、**通知管理**相关插件。
2. 在 NocoBase 中配置钉钉认证器（Client ID、Client Secret），并在认证器中填写 **Agent ID**（应用 AgentId，用于调用工作通知接口）。
3. 用户需使用钉钉登录完成绑定，系统才能根据 `usersAuthenticators` 中的标识解析钉钉用户。当前认证器可配置的唯一标识为 `openId`、`unionId` 或 `mobile`；发送前服务端会按当前标识尝试解析为钉钉接口所需的 **userid**。

## 添加钉钉通知渠道

在「通知管理」中新增渠道，通知类型选择 **钉钉（dingtalk）**。

## 配置渠道

![](https://static-docs.nocobase.com/20260513232350.png)

- **认证器**：选择用于发送消息的钉钉认证器（需包含可用的 Client ID、Client Secret 与 AgentId）。

## 消息模板（类型）

![](https://static-docs.nocobase.com/20260513232435.png)

- **Text 模板**：对应钉钉工作通知 `msgtype: text`，适合发送纯文本通知，配置 `text.content`。
- **Markdown 模板**：对应钉钉工作通知 `msgtype: markdown`，适合纯展示类通知（文本、图片、链接等以钉钉客户端能力为准）。
- **ActionCard 模板**：对应 `action_card`。  
  - **整体跳转**：单按钮，整张卡片指向同一链接。  
  - **独立跳转**：填写 `btn_json_list` JSON 数组，多个按钮各自 `action_url`（与钉钉 ActionCard 多按钮一致）。
- **Form 模板（OA）**：对应 `msgtype: oa`，适合订单等结构化展示；可配置头部、正文标题与摘要、可选 `form` 键值行 JSON，以及点击消息跳转的 `message_url` / `pc_message_url`。

## 工作流与自动化

在通知节点中选择已配置的钉钉渠道，按表单填写收件人与消息内容即可。
