---
title: '@nocobase/plugin-notifications'
---

# @nocobase/plugin-notifications

提供通知模块

<Alert title="注意" type="warning">

暂时只实现了核心三步骤：

- 通知模板：包括主题、内容、接收人配置、发送服务等等
- 通知服务：可以是短信、邮件等等
- 通知日志：记录通知状态

</Alert>

## 安装

```bash
yarn nocobase pull notifications --start
```

## 示例

```ts
const Notification = db.getModel('notifications');
const notification = await Notification.create({
  subject: 'Subject',
  body: 'hell world',
  receiver_options: {
    data: 'to@nocobase.com',
    fromTable: 'users',
    filter: {},
    dataField: 'email',
  },
});
await notification.updateAssociations({
  service: {
    type: 'email',
    title: '阿里云邮件推送',
    options: {
      host: "smtpdm.aliyun.com",
      port: 465,
      secure: true,
      auth: {
        user: 'from@nocobase.com',
        pass: 'pass',
      },
      from: 'NocoBase<from@nocobase.com>',
    },
  },
});
await notification.send();
```

## Action API

### notifications:send

发送通知

```ts
await api.resource('notifications').send({
  resourceKey: 1,
  to: 'demo@nocobase.com',
});
```
