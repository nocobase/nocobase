# 通知管理

<PluginInfo name="notification-manager"></PluginInfo>

## 介绍

通知管理是一个集成多渠道通知方式的中心化服务，提供统一的渠道配置、发送管理和日志记录，支持灵活扩展。

![20240928112556](https://static-docs.nocobase.com/20240928112556.png)

- 紫色部分：通知管理，提供统一的管理服务，涵盖渠道配置、日志记录等功能，通知渠道可扩展；
- 绿色部分：站内信（In-App Message），内置的渠道，支持用户在应用内接收消息通知；
- 红色部分：电子邮件（Email），扩展的渠道，支持用户通过电子邮件接收通知。

## 渠道管理

![20240928181752](https://static-docs.nocobase.com/20240928181752.png)

目前已支持的渠道有：

- [站内信](/features/notification-in-app-message)
- [电子邮件](/features/notification-email)（内置 SMTP 传输方式）

也可以扩展更多渠道通知，参考[渠道扩展](./development/extension)文档

## 通知日志

详细记录每条通知的发送详情和状态，便于分析和故障排查。

![20240928181649](https://static-docs.nocobase.com/20240928181649.png)

## 工作流通知节点

![20240928181726](https://static-docs.nocobase.com/20240928181726.png)
