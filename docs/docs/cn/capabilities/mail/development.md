---
title: '开发参考'
description: '接入邮件页面、权限和后台任务。'
---

# 开发参考

Mail 自带邮件页面，也可以在客户、项目等业务页面中扩展。应用负责服务商配置、角色授权和业务关联；Mail 提供页面、账号、收发和同步能力。

## 邮件页面

注册插件后应用不写页面代码，就有四个页面：

| 页面                       | 路径             | 用途                                             |
| -------------------------- | ---------------- | ------------------------------------------------ |
| 邮件                       | `/mail`          | 邮件列表、阅读、写信和回复，导航显示未读数。     |
| 团队邮件                   | `/mail/team`     | 只读查看成员已同步的邮件，可选批量处理。         |
| 个人设置 › 消息 › 邮箱账号 | `/me/mail`       | 连接邮箱，管理签名、模板、标签，查看收发记录。   |
| 系统设置 › 消息 › 邮箱     | `/settings/mail` | 服务商、所有账号状态、同步和发送记录、运行配置。 |

每个页面都可以按路由名（`mail`、`mailTeam`、`mailAccounts`、`mailSettings`）用 `routeComponentOverrides` 整页替换。自己组合页面时仍可使用 `MailWorkspacePage`、`MailAccountsPage` 和 `@nocobase/app-plugin-mail/client/components` 的公开组件。

## 扩展邮件页面

客户端插件取出 `mailExtensionsToken`，登记服务商标题、邮件侧栏、写信工具、工作台按钮、模板变量和发送后回调：

```ts
const mail = this.app.container.resolve(mailExtensionsToken);
mail.slots.messageAside.add({ name: 'customer', component: CustomerPanel });
mail.templateVariables.add({
  key: 'customer',
  label: '客户',
  resolve: ({ to }) => findCustomer(to),
});
```

## 结合业务数据

应用确定邮件和业务记录的关联规则。例如，客户详情按联系人邮箱匹配邮件，项目页把项目名称和进度带入邮件模板。结合数据时应明确匹配字段、收件人来源和发送前是否需要人工确认。

客户端可通过 `useMailClient()` 使用公开邮件接口；服务端通过 `mailServiceToken` 获取邮件服务。HTTP 接口的请求和响应以当前应用的 OpenAPI 为准。

## 配置访问权限

| 权限                     | 级别       | 用途                                           |
| ------------------------ | ---------- | ---------------------------------------------- |
| 邮件（`mail.workspace`） | 使用       | 个人邮件和邮箱账号。                           |
| 团队邮件                 | 查看、处理 | 查看成员邮件；处理可批量标已读、星标、归档。   |
| 邮箱设置                 | 查看、管理 | 账号状态和收发记录；管理可重试、取消成员任务。 |

在角色权限页勾选。「处理」「管理」不包含「查看」。个人账号和邮件操作按账号所有者限制。已结束的同步和发送记录默认保留 90 天（`mail.logRetentionDays`）。

## 服务商与后台任务

在服务端和客户端注册 Mail，并将配置工厂接入应用配置；服务商连接信息由 `mail.providers` 维护。同步和发送使用应用的后台任务服务，部署时需要保证任务执行器运行，多实例部署使用共享任务后端。

OAuth 接入还需配置应用对外回调地址和授权后的返回页面。IMAP/SMTP 的同步限制见[邮箱接入配置](./configuration.md#接入方式的差异)。

需要签名、模板或业务页面的需求示例，见[更多邮件功能](./usage.md)。
