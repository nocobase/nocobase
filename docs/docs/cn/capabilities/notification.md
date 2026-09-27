---
title: '通知'
description: '在 NocoBase 3 中发送站内信、邮件和即时通讯消息，并查看投递日志。'
keywords: 'NocoBase,通知,站内信,邮件,即时通讯,飞书,钉钉,服务商,Provider'
---

# 通知

在 NocoBase 3 中，通知用于向用户发送站内信、邮件和即时通讯消息，并记录每次投递的状态。默认应用已经注册通知相关插件。通常来说，你只需要在 `config.yml` 中配置需要使用的 Channel，再从业务代码调用通知服务。

需要关联用户自己的邮箱、同步收件箱或回复邮件时，使用[邮件](./mail/index.md)能力。通知邮件与用户邮箱使用不同的配置和发送记录。

## 通知由哪些部分组成

通知由下面几个插件共同提供：

| 插件                                          | 负责什么                                                                     |
| --------------------------------------------- | ---------------------------------------------------------------------------- |
| `@nocobase/app-plugin-notification`           | 保存 Notification、Delivery 和投递执行记录，处理队列、重试、日志和测试发送。 |
| `@nocobase/app-plugin-notification-in-app`    | 提供站内信 Provider（`in-app`），把消息保存到用户的收件箱。                  |
| `@nocobase/app-plugin-notification-providers` | 提供邮件和即时通讯 Provider，以及 SMTP、Resend、飞书 Webhook、钉钉 Webhook。 |

其中：

- **Channel** 是配置中的命名消息通道，决定一条消息使用哪种消息结构和 Provider
- **Provider** 负责把消息提交给具体的投递目标，比如数据库收件箱、SMTP 服务或群机器人 Webhook
- **Notification** 表示一次业务通知
- **Delivery** 表示这条通知通过某个命名 Channel 产生的一次投递记录

一次通知可以在 `messages` 中指定多个命名 Channel。系统会为每个 Channel 创建独立的 Delivery，方便你查看整条通知的结果，也能定位某个 Provider 调用失败的原因。

## 默认应用已配置通知

基于 `app-template-default` 或 `app-template-examples` 创建的应用已经注册核心通知、站内信和内置 Provider。默认配置启用了名为 `inbox` 的站内信 Channel：

```yaml
notification:
  channels:
    inbox:
      provider: in-app
```

`channels` 是一个以 Channel 名称为键的配置对象。示例中的 `inbox` 是 Channel 名称，业务代码通过这个名称选择发送通道。每个 Channel 只配置一个 Provider，Provider 类型和相关参数直接写在该 Channel 下。

首次启用通知插件或新增通知相关插件后，请执行应用迁移：

```bash
pnpm nocobase db apply
```

核心插件会创建通知、投递和投递执行记录数据表，站内信插件会创建收件箱数据表。如果应用配置中的 `database.connections.main.migrations.autoRun` 为 `true`，应用启动时也会自动执行待处理迁移。

如果你使用自定义应用，请按需要注册插件：

```bash
pnpm nocobase plugin register notification
pnpm nocobase plugin register notification-in-app
pnpm nocobase plugin register notification-providers
pnpm nocobase db apply
```

如果不需要站内信，可以不注册 `notification-in-app`；如果不需要邮件或即时通讯，可以不注册 `notification-providers`。不过，`config.yml` 中配置的每个 Provider 都必须有对应的插件定义。

## 配置通知渠道

通知配置写在应用的 `config.yml` 中，入口是 `notification`。其中，`channels` 用于配置命名消息通道，`retry` 用于配置自动重试策略。Channel 名称是映射中的键，必须保持稳定，因为它会写入 Delivery 记录，并用于后续查询和重试。

Provider 的配置直接写在对应 Channel 下。同一种 Provider 可以配置在多个命名 Channel 中，比如用 `system-email` 和 `marketing-email` 分别连接不同的邮件服务。

每个 Channel 默认启用。需要暂时停用某个 Channel 时，可以设置 `enabled: false`；停用后，新的消息不会通过该 Channel 投递，正在重试的投递也不会切换到其他 Channel。Channel 名称和 Provider 类型需要保持稳定，因为它们会写入投递记录。

通知服务会在入队前校验消息和接收人。校验失败时不会保存 Notification 或创建 Delivery。进入投递阶段后，每条 Delivery 独立记录提交结果和重试状态。

### 配置结构

| 配置项                  | 类型 | 说明                                                                     |
| ----------------------- | ---- | ------------------------------------------------------------------------ |
| `notification`          | 对象 | 通知插件的顶层配置。                                                     |
| `notification.channels` | 对象 | Channel 名称到 Provider 配置的映射；每个 Channel 只能配置一个 Provider。 |
| `notification.retry`    | 对象 | 自动重试配置；默认只尝试一次，不自动重试。                               |

### 通用配置字段

| 配置项                 | 是否必填        | 说明                                                                                                  |
| ---------------------- | --------------- | ----------------------------------------------------------------------------------------------------- |
| Channel 名称（映射键） | 是              | 业务代码在 `messages` 中使用的名称，必须是非空字符串，长度不超过 100 个字符，并且在投递期间保持稳定。 |
| `provider`             | 是              | Provider 类型标识，比如 `in-app`、`smtp`、`resend`、`feishu-webhook` 或 `dingtalk-webhook`。          |
| `enabled`              | 否，默认 `true` | 是否启用当前 Channel。设置为 `false` 后，新的消息不会使用该 Channel。                                 |

### 重试配置

默认情况下，通知只尝试发送一次。需要启用自动重试时，在 `notification.retry` 中设置最大尝试次数和重试间隔：

自动重试只处理 Provider 判断为可以安全再次提交的临时失败，并且始终使用原来的 Channel 和 Provider。常见情况包括：

- Provider 返回可重试的限流错误
- Provider 暂时不可用，但已经明确本次提交失败，可以再次提交
- 请求在提交前发生临时网络错误，运行时可以确认消息尚未发出

消息内容、接收人、认证或配置错误不会自动重试。提交结果无法确认时——比如请求超时，或提交后连接中断——Delivery 会进入 `unknown`，也不会自动重试，以免产生重复消息。只有 Provider 将失败标记为可重试，并且当前尝试次数未达到 `maxAttempts` 时，系统才会安排下一次投递。

```yaml
notification:
  retry:
    maxAttempts: 3
    intervalMs: 5000
```

| 配置项                           | 是否必填        | 说明                                                                        |
| -------------------------------- | --------------- | --------------------------------------------------------------------------- |
| `notification.retry.maxAttempts` | 否，默认 `1`    | 单条 Delivery 的最大自动尝试次数，包含首次发送；设置为 `1` 表示不自动重试。 |
| `notification.retry.intervalMs`  | 否，默认 `5000` | 自动重试之间的等待时间，单位为毫秒。                                        |

每次自动重试都使用固定的 `intervalMs`，不使用指数退避和随机抖动。Provider 返回 `Retry-After` 时，会优先使用 Provider 指定的等待时间。

### 站内信

站内信使用数据库 Provider 保存消息，不需要外部服务凭据：

```yaml
notification:
  channels:
    inbox:
      provider: in-app
```

站内信消息的接收人是应用用户 ID。站内信服务端 API 会按当前登录用户隔离数据；如果要展示收件箱，可以调用站内信插件提供的 API，也可以在应用中实现自己的页面。

站内信 Channel 没有额外配置项，`provider` 固定为 `in-app`。

### 邮件

邮件可以使用 SMTP 或 Resend。SMTP 配置示例：

```yaml
notification:
  channels:
    system-email:
      provider: smtp
      host: smtp.example.com
      port: 587
      secure: false
      auth:
        user: mailer@example.com
        pass: replace-with-the-smtp-password
      from: NocoBase <mailer@example.com>
      replyTo: reply@example.com
```

端口 `465` 通常使用 `secure: true`，端口 `587` 通常使用 `secure: false` 并通过 STARTTLS 升级连接。Gmail 等服务通常需要应用专用密码，不要填写账号登录密码。

SMTP Provider 的字段如下：

| 配置项      | 是否必填 | 说明                                                                                  |
| ----------- | -------- | ------------------------------------------------------------------------------------- |
| `provider`  | 是       | 固定为 `smtp`。                                                                       |
| `host`      | 是       | SMTP 服务器主机名或 IP 地址。                                                         |
| `port`      | 是       | SMTP 服务端口，必须是 `1` 到 `65535` 之间的整数。                                     |
| `secure`    | 否       | 是否直接使用 TLS 连接 SMTP。端口 `465` 通常设为 `true`，端口 `587` 通常设为 `false`。 |
| `auth`      | 否       | SMTP 认证配置对象；需要认证时同时填写 `auth.user` 和 `auth.pass`。                    |
| `auth.user` | 否       | SMTP 认证用户名；只有 SMTP 服务要求认证时才需要填写。                                 |
| `auth.pass` | 否       | SMTP 认证密码；不要将真实密码提交到 Git 或写入日志。                                  |
| `from`      | 否       | 默认发件人地址。消息本身提供 `from` 时，会覆盖此配置。                                |
| `replyTo`   | 否       | 默认回复地址。消息本身提供 `replyTo` 时，会覆盖此配置。                               |

Resend 配置示例：

```yaml
notification:
  channels:
    marketing-email:
      provider: resend
      apiKey: replace-with-the-resend-api-key
      from: NocoBase <notifications@example.com>
      replyTo: reply@example.com
```

生产环境的 `from` 应使用已经通过 Resend 验证的域名。

邮件消息需要提供原生邮箱地址、主题，以及 `text` 或 `html` 内容。`to` 可以是一个地址，也可以是非空地址数组；数组中的每个地址都会创建独立的投递，并分别记录重试结果。

Resend Provider 的字段如下：

| 配置项     | 是否必填 | 说明                                                         |
| ---------- | -------- | ------------------------------------------------------------ |
| `provider` | 是       | 固定为 `resend`。                                            |
| `apiKey`   | 是       | Resend API 密钥，用于调用 Resend API；请通过运行时密钥注入。 |
| `from`     | 是       | 默认发件人地址，必须使用已经通过 Resend 验证的域名。         |
| `replyTo`  | 否       | 默认回复地址。消息本身提供 `replyTo` 时，会覆盖此配置。      |

### 飞书和钉钉

即时通讯消息通过群机器人 Webhook 发送。飞书示例：

```yaml
notification:
  channels:
    ops-feishu:
      provider: feishu-webhook
      webhookUrl: https://open.feishu.cn/open-apis/bot/v2/hook/replace-me
      secret: replace-with-the-feishu-secret
```

钉钉示例：

```yaml
notification:
  channels:
    ops-dingtalk:
      provider: dingtalk-webhook
      webhookUrl: https://oapi.dingtalk.com/robot/send?access_token=replace-me
      secret: replace-with-the-dingtalk-secret
```

飞书和钉钉 Webhook Provider 会直接把消息发送到配置的 Webhook 地址，因此消息不需要填写接收人。即时通讯消息的 `target` 必须是完整的 HTTP(S) URL。

飞书 Webhook 只接受 `open.feishu.cn` 或 `open.larksuite.com` 下的 HTTPS 地址，钉钉 Webhook 只接受 `oapi.dingtalk.com` 下的 HTTPS 地址，并且都会拒绝重定向。通知服务不会自动把应用用户转换成邮箱或手机号，也不会在多个 Channel 之间自动路由或回退。`messages` 中的每一项都需要提供对应 Channel 的完整消息。

飞书和钉钉 Webhook Channel 的字段如下：

| 配置项       | 是否必填 | 说明                                                                |
| ------------ | -------- | ------------------------------------------------------------------- |
| `provider`   | 是       | 飞书固定为 `feishu-webhook`，钉钉固定为 `dingtalk-webhook`。        |
| `webhookUrl` | 是       | 机器人 Webhook 地址，必须使用对应官方域名下的 HTTPS URL。           |
| `secret`     | 否       | Webhook 签名密钥。填写后，Provider 会按对应平台规则为请求生成签名。 |

:::warning 注意

Webhook 地址、签名密钥、SMTP 密码和 Resend API 密钥都是凭据。不要把真实值提交到 Git、写入日志或放进错误信息。实际使用的 `config.yml` 不要纳入版本控制，并通过运行时密钥配置注入真实值。

:::

## 从业务代码发送通知

在服务端代码中，从应用容器获取共享的 `notificationServiceToken`，再调用 `send()`。不要在业务模块中创建第二个 Notification Manager，也不要直接调用 SMTP、Resend 或 Webhook。

`send()` 接收一个参数对象，其中：

| 参数             | 是否必填 | 说明                                                                                                            |
| ---------------- | -------- | --------------------------------------------------------------------------------------------------------------- |
| `idempotencyKey` | 是       | 用于标识同一次业务发送。相同请求重复使用这个值时会返回原来的 Notification，避免重复创建。                       |
| `source`         | 否       | 业务来源信息。`type` 必填，`referenceId` 可选，用于在通知记录中关联业务对象。                                   |
| `messages`       | 是       | 以 Channel 名称为键的消息映射，至少包含一项。每个键必须对应已启用的 Channel；同一次调用可以发送到多个 Channel。 |

每个 `messages.<channel>` 的字段取决于 Channel 类型。内置 Channel 的消息字段如下：

| Channel 类型 | 必填字段                          | 可选字段                                | 说明                                                                         |
| ------------ | --------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------- |
| 站内信       | `to`、`title`、`body`             | `target`                                | `to` 是应用用户 ID 或 ID 数组；`target` 可以是内部路由或完整的 HTTP(S) URL。 |
| 邮件         | `to`、`subject`、`text` 或 `html` | `from`、`replyTo`                       | `to` 可以是一个邮箱地址或地址数组；数组中的每个地址都会创建独立的 Delivery。 |
| Webhook      | `text`                            | `title`、`target`、`format`、`payloads` | Webhook 消息不填写 `to`；`target` 必须是完整的 HTTP(S) URL。                 |

下面的示例通过 `inbox` Channel 给申请人发送一条站内信：

```ts
import { notificationServiceToken } from '@nocobase/app-plugin-notification/server';

const notification = app.container.resolve(notificationServiceToken);

const result = await notification.send({
  // 同一次业务事件重试时必须复用同一个幂等键
  idempotencyKey: `approval:${approval.id}:approved:${approval.version}`,
  source: {
    type: 'approval',
    referenceId: approval.id,
  },
  messages: {
    inbox: {
      to: approval.requesterId,
      title: '审批已通过',
      body: `订单 ${approval.orderNo} 已通过审批。`,
      target: { type: 'route', path: `/orders/${approval.orderId}` },
    },
  },
});
```

`messages` 的键必须对应 `notification.channels` 中已经配置的 Channel 名称。站内信的 `target` 可以是应用内部路由，也可以是完整的 HTTP(S) URL；内部路由不要包含部署前缀，NocoBase 会在客户端导航时自动处理当前应用的 basename。

如果要发送邮件，可以在同一次调用中使用另一个命名 Channel：

```ts
await notification.send({
  idempotencyKey: `approval:${approval.id}:approved:email`,
  messages: {
    'system-email': {
      to: approval.requesterEmail,
      subject: '审批已通过',
      text: `订单 ${approval.orderNo} 已通过审批。`,
    },
  },
});
```

即时通讯消息可以通过 `target` 附带外部链接：

```ts
await notification.send({
  idempotencyKey: `deployment:${deployment.id}:feishu`,
  messages: {
    'ops-feishu': {
      text: `版本 ${deployment.version} 已部署完成。`,
      target: {
        type: 'url',
        url: `https://example.com/deployments/${deployment.id}`,
      },
    },
  },
});
```

`idempotencyKey` 用于标识一次业务发送。相同的 `idempotencyKey` 和相同的请求会返回原来的 Notification，不会重复创建；如果同一个 `idempotencyKey` 对应了不同内容，则会抛出冲突错误。因此，队列重试、请求超时后重发或服务恢复时，都要复用原来的幂等键。

`send()` 通常返回 `pending` 或 `processing`，这只表示 Notification 已保存并交给队列。Delivery 处于 `accepted` 状态，才表示 Provider 接受了提交；这仍不代表最终用户已经收到或阅读。需要确认结果时，请保存返回的 Notification ID，再查询通知状态和投递日志。

## 订阅状态、查询结果和重试

`send()` 返回 Notification ID、幂等键、当前状态和 Delivery 列表。发送请求进入队列后，调用方可以按 Notification ID 或幂等键查询结果，也可以订阅状态变化。

### 订阅状态变化

使用 `onStatusChanged()` 订阅一条 Notification 的状态变化。过滤条件必须提供 `notificationId` 或 `idempotencyKey`，订阅成功后会先收到一次当前状态，之后在状态变化时继续收到更新。这个订阅只在当前服务进程内有效，进程重启后需要重新查询或订阅。

```ts
const unsubscribe = notification.onStatusChanged(
  { notificationId: result.notificationId },
  (event) => {
    if (event.terminal) {
      console.log(`通知最终状态：${event.status}`);
      unsubscribe();
    }
  },
);
```

不再需要监听时，调用返回的 `unsubscribe()` 函数取消订阅。回调事件包含 Notification 状态、汇总结果和各条 Delivery 的最新状态；`terminal` 为 `true` 时表示不会再有自动状态变化。

### 查询通知结果

已知 Notification ID 时，调用 `getNotification()`；只有幂等键时，调用 `getByIdempotencyKey()`。两个方法都返回状态快照，查询不到记录时返回 `undefined`。

```ts
const current = await notification.getNotification(result.notificationId);
const sameNotification = await notification.getByIdempotencyKey(
  result.idempotencyKey,
);

if (current) {
  console.log(current.status, current.deliveries);
}
```

状态快照包含 Notification 的整体状态、`terminal`、`requiresAction`、各状态数量，以及每条 Delivery 的 Channel、Provider、投递状态、错误、尝试次数和 `nextRunAt`。诊断失败时，先读取 Notification 和 Delivery，再结合服务端日志定位原因。

### 重试失败的 Delivery

重试前先读取对应 Delivery 的状态：

Delivery 一共有以下状态：

| 状态         | 含义                                                  | 处理方式                                               |
| ------------ | ----------------------------------------------------- | ------------------------------------------------------ |
| `pending`    | Delivery 已保存，等待队列执行。                       | 等待队列处理，不要手动重试。                           |
| `preparing`  | 正在准备消息。                                        | 等待准备过程完成。                                     |
| `submitting` | 正在向 Provider 提交消息。                            | 等待 Provider 返回结果，不要重复提交。                 |
| `retrying`   | 已安排自动重试，`nextRunAt` 表示最早执行时间。        | 等待自动重试，不要手动重试。                           |
| `accepted`   | Provider 已接受提交，但不代表最终用户已经收到或阅读。 | 不要重试；需要确认最终送达时，检查 Provider 或收件箱。 |
| `failed`     | 已确认投递失败，且没有等待中的自动重试。              | 修复原因后可以手动重试。                               |
| `unknown`    | 无法确认 Provider 是否收到请求。                      | 先检查 Provider 后台或目标收件箱，不要直接重试。       |

- 如果接收人格式不支持，不能修改原 Delivery；修正接收人后应创建新的 Notification

手动重试只适用于 `failed` 状态。调用 `retryDelivery()` 时，`reason` 必填；每次手动重试都会写入重试审计记录。重试仍绑定原来的 Channel 和 Provider，不会自动切换到其他 Provider。

```ts
const snapshot = await notification.getNotification(result.notificationId);
const delivery = snapshot?.deliveries.find((item) => item.status === 'failed');

if (delivery) {
  const retried = await notification.retryDelivery({
    deliveryId: delivery.id,
    reason: '已确认 Provider 已恢复，重新发送这条失败投递。',
  });
  console.log(retried.status);
}
```

对于 `unknown` 状态，不要直接调用 `retryDelivery()`。先到 Provider 后台或目标收件箱确认结果；如果确认没有发送成功，再重新发起一条新的 Notification。

## 测试发送和查看日志

启用客户端通知插件后，进入「设置 / 通知 / 通知日志」即可查看最近的 Notification、Delivery 和投递执行记录。

页面提供「发送测试通知」按钮。页面会列出已启用的 Channel，并根据 Channel 显示可安全填写的测试字段；提交测试时只需要发送 Channel 名称和字段值，不需要在浏览器中填写 Provider 名称或凭据。

- 站内信测试必须填写接收用户 ID
- 邮件测试必须填写接收邮箱
- 即时通讯测试会直接发送到对应 Webhook
- 测试发送会调用正式的 Notification Manager，并写入通知日志

日志页面需要 `page:notification.logs` 的 `access` 权限。提交测试消息时还需要 `notification:test` 的 `send` 权限。测试发送会产生真实的外部消息，生产环境只在确认接收范围后使用。

## 投递状态怎么看

通知状态会根据其下所有 Delivery 汇总：

| 状态         | 含义                                   |
| ------------ | -------------------------------------- |
| `pending`    | 投递已经保存，等待队列执行             |
| `processing` | 至少一条投递正在准备、提交或等待重试   |
| `completed`  | 所有投递都已经被 Provider 接受         |
| `partial`    | 已结束的投递中同时有成功和失败         |
| `failed`     | 所有投递都失败，且没有等待中的自动重试 |
| `unknown`    | 至少一次 Provider 提交结果无法确认     |

Delivery 还可能处于 `preparing`、`submitting`、`retrying`、`accepted`、`failed` 和 `unknown` 状态。`retrying` 表示已经安排下一次自动重试；`accepted` 表示 Provider 已接受提交，不等于最终送达；`unknown` 表示消息可能已经发出，不要直接当成未发送处理。

遇到 `pending` 或长时间 `processing` 时，先检查队列工作进程、应用迁移和服务端日志。`failed` 需要查看接收人、凭据、Provider 配置和错误类别。对于 `partial`，请逐条检查失败的 Delivery，不要为了重发整条通知而再次发送所有 Channel。

如果状态是 `unknown`，先到对应 Provider 的后台或目标群组确认提交结果。如果确认没有发送成功，再发起一条新的 Notification。

## 相关链接

- [5. 发通知](../tutorials/notifications.md) —— 通过审批案例完成配置、发送和排查
- [工作流快速开始](./workflow/quick-start.md) —— 了解如何让应用智能体（Agent）接入后台业务流程
- [Run 节点](./workflow/development/nodes/run.md) —— 在工作流中调用应用服务（Service）和通知服务
- [应用配置](../app/configuration.md) —— 了解 `config.yml` 和运行时配置
