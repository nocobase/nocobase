---
pkg: '@nocobase/plugin-workflow-mailer'
---

# 邮件发送

## 介绍

用于发送电子邮件，支持文本和 HTML 格式的邮件内容。

## 创建节点

在工作流配置界面中，点击流程中的加号（“+”）按钮，添加“邮件发送”节点：

![20251031130522](https://static-docs.nocobase.com/20251031130522.png)

## 节点配置

![20251031131125](https://static-docs.nocobase.com/20251031131125.png)

各个选项均可使用流程上下文中的变量，对于敏感信息，也可以使用全局变量与密钥。

## 常见问题

### Gmail 发送触发频次限制

部分邮件发送时会遇到如下错误：

```json
{
  "code": "ECONNECTION",
  "response": "421-4.7.0 Try again later, closing connection. (EHLO)\n421-4.7.0 For more information, go to\n421 4.7.0 About SMTP error messages - Google Workspace Admin Help 3f1490d57ef6-e7f7352f44csm831688276.30 - gsmtp",
  "responseCode": 421,
  "command": "EHLO"
}
```

这是由于 Gmail 对未标注发送域名的发送请求进行了频次限制，需要在部署应用时配置服务器的主机名为在 Gmail 绑定的发送域名。例如 Docker 部署时：

```yaml
services:
  app:
    image: nocobase/nocobase
    hostname: <your-custom-hostname> # 设置为已绑定的发送域名
```

参考：[Google SMTP Relay - Intermittent problems](https://forum.nocobase.com/t/google-smtp-relay-intermittent-problems/5483/6)
