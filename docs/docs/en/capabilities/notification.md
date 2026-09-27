---
title: 'Notifications'
description: 'Send in-app messages, email, and instant messages in NocoBase 3, then inspect delivery logs.'
keywords: 'NocoBase,notifications,in-app,email,instant messaging,Feishu,DingTalk,Provider'
---

# Notifications

NocoBase 3 notifications send in-app messages, email, and instant messages while keeping the status of every delivery. The default applications already register the notification plugins, so most applications only need to configure the Channels they use in `config.yml` and resolve the notification service from application code.

## Notification building blocks

The notification capability is composed of these plugins:

| Plugin                                        | Responsibility                                                                                               |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `@nocobase/app-plugin-notification`           | Stores Notifications, Deliveries, and delivery execution records; runs queues, retries, logs, and test sends |
| `@nocobase/app-plugin-notification-in-app`    | Provides the `in-app` Provider and stores messages in the user's inbox                                       |
| `@nocobase/app-plugin-notification-providers` | Provides email and instant-message Providers, including SMTP, Resend, Feishu, and DingTalk                   |

The main concepts are:

- **Channel** — a named message route that selects the message schema and Provider
- **Provider** — submits a message to a concrete destination such as the database inbox, SMTP, or a bot Webhook
- **Notification** — one business notification
- **Delivery** — one delivery created through a named Channel

One Notification can specify several named Channels in `messages`; NocoBase creates an independent Delivery for each one. This lets you inspect the overall Notification and then locate a failure in one Provider submission.

## Default application configuration

Applications created from `app-template-default` or `app-template-examples` register the core notification, in-app, and built-in Provider plugins. The default configuration enables an in-app Channel named `inbox`:

```yaml
notification:
  channels:
    inbox:
      provider: in-app
```

`channels` is a configuration object keyed by Channel names. In this example, `inbox` is the Channel name that application code uses to select the sending route. Each Channel configures one Provider, with the Provider type and settings written directly under that Channel.

Run application migrations after enabling notification plugins or adding a notification plugin:

```bash
pnpm nocobase db apply
```

The core plugin creates the Notification, Delivery, and delivery execution record tables. The in-app plugin creates the inbox table. If `database.connections.main.migrations.autoRun` is `true`, the application also runs pending migrations during startup.

For a custom application, register the plugins required by your Channels:

```bash
pnpm nocobase plugin register notification
pnpm nocobase plugin register notification-in-app
pnpm nocobase plugin register notification-providers
pnpm nocobase db apply
```

You can omit `notification-in-app` when you do not need in-app messages, or omit `notification-providers` when you do not need email or instant messaging. Every Provider referenced by `config.yml` must have a corresponding registered definition.

## Configure Channels

Configure notifications under `notification.channels` in `config.yml`. The Channel name is the map key and must remain stable because it is stored in Delivery records and used for later inspection and retries.

Provider configuration is written directly under its Channel. The same Provider type can be used by several named Channels, such as `system-email` and `marketing-email` with different email settings.

Each Channel is enabled by default. Set `enabled: false` to pause one; new messages will not use it, and an existing retry will not be rerouted to another Channel. Keep Channel names and Provider types stable because they are stored in Delivery records.

The service validates messages and recipients before enqueueing; an invalid request creates no Notification or Delivery. Once delivery starts, each Delivery records its submission and retry state independently.

### Configuration structure

| Configuration item      | Type   | Description                                                                       |
| ----------------------- | ------ | --------------------------------------------------------------------------------- |
| `notification`          | Object | Top-level configuration for the notification plugin.                              |
| `notification.channels` | Object | Map from Channel names to Provider configurations; each Channel has one Provider. |
| `notification.retry`    | Object | Automatic retry configuration; one attempt is used by default.                    |

### Common configuration fields

| Configuration item     | Required               | Description                                                                                                                    |
| ---------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Channel name (map key) | Yes                    | The name used in `messages`. It must be a non-empty string of at most 100 characters and remain stable while Deliveries exist. |
| `provider`             | Yes                    | Provider type identifier, such as `in-app`, `smtp`, `resend`, `feishu-webhook`, or `dingtalk-webhook`.                         |
| `enabled`              | No, defaults to `true` | Whether this Channel is enabled. New messages do not use it when it is `false`.                                                |

### Retry configuration

By default, a notification is submitted once. To enable automatic retries, set the maximum attempts and retry interval under `notification.retry`:

Automatic retries handle only transient failures that the Provider marks as safe to submit again, and they remain bound to the original Channel and Provider. Common cases include:

- The Provider returns a retryable rate-limit error
- The Provider is temporarily unavailable but confirms that the submission failed and can be retried
- A transient network error occurs before submission and the runtime can confirm that the message was not sent

Message, recipient, authentication, and configuration errors are not retried automatically. When the submission result cannot be confirmed—such as a timeout or a connection loss after submission—the Delivery becomes `unknown` and is not retried automatically to avoid duplicate messages. The runtime schedules another delivery only when the Provider marks the failure as retryable and the current attempt count is below `maxAttempts`.

```yaml
notification:
  retry:
    maxAttempts: 3
    intervalMs: 5000
```

| Configuration item               | Required               | Description                                                                                           |
| -------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------- |
| `notification.retry.maxAttempts` | No, defaults to `1`    | Maximum automatic submissions for one Delivery, including the first submission. `1` disables retries. |
| `notification.retry.intervalMs`  | No, defaults to `5000` | Fixed wait between automatic retries in milliseconds.                                                 |

Automatic retries use the fixed `intervalMs`; they do not use exponential backoff or jitter. A valid Provider `Retry-After` value takes precedence over this interval.

### In-app messages

The in-app Provider stores messages in the database and needs no external credentials:

```yaml
notification:
  channels:
    inbox:
      provider: in-app
```

In-app messages use application user IDs as recipients. The in-app API isolates data by the authenticated user, so an application page can use the Provider's public inbox API or provide its own inbox page.

An in-app Channel has no provider-specific fields. Its `provider` is always `in-app`.

### Email

Email Channels can use SMTP or Resend. SMTP configuration:

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

Port `465` usually uses `secure: true`; port `587` usually uses `secure: false` and upgrades through STARTTLS. Gmail and similar services often require an app password instead of the account password.

SMTP Channel fields:

| Configuration item | Required | Description                                                                                                  |
| ------------------ | -------- | ------------------------------------------------------------------------------------------------------------ |
| `provider`         | Yes      | Must be `smtp`.                                                                                              |
| `host`             | Yes      | SMTP server hostname or IP address.                                                                          |
| `port`             | Yes      | SMTP service port, as an integer from `1` through `65535`.                                                   |
| `secure`           | No       | Whether to connect to SMTP directly over TLS. Use `true` commonly for port `465` and `false` for port `587`. |
| `auth`             | No       | SMTP authentication object; set both `auth.user` and `auth.pass` when authentication is required.            |
| `auth.user`        | No       | SMTP authentication username, when the SMTP service requires authentication.                                 |
| `auth.pass`        | No       | SMTP authentication password. Do not commit the real password or write it to logs.                           |
| `from`             | No       | Default sender address. A `from` value in the message overrides it.                                          |
| `replyTo`          | No       | Default reply-to address. A `replyTo` value in the message overrides it.                                     |

Resend configuration:

```yaml
notification:
  channels:
    marketing-email:
      provider: resend
      apiKey: replace-with-the-resend-api-key
      from: NocoBase <notifications@example.com>
      replyTo: reply@example.com
```

Use a sender domain verified by Resend in production.

An email message needs a native email address, a subject, and either `text` or `html`. `to` can be one address or a non-empty array; each address creates an independent Delivery with its own retry result.

Resend Channel fields:

| Configuration item | Required | Description                                                                            |
| ------------------ | -------- | -------------------------------------------------------------------------------------- |
| `provider`         | Yes      | Must be `resend`.                                                                      |
| `apiKey`           | Yes      | Resend API key used to call the Resend API; inject it through a runtime secret source. |
| `from`             | Yes      | Default sender address. Use a domain verified by Resend.                               |
| `replyTo`          | No       | Default reply-to address. A `replyTo` value in the message overrides it.               |

### Feishu and DingTalk

Instant messages use bot Webhooks. Feishu configuration:

```yaml
notification:
  channels:
    ops-feishu:
      provider: feishu-webhook
      webhookUrl: https://open.feishu.cn/open-apis/bot/v2/hook/replace-me
      secret: replace-with-the-feishu-secret
```

DingTalk configuration:

```yaml
notification:
  channels:
    ops-dingtalk:
      provider: dingtalk-webhook
      webhookUrl: https://oapi.dingtalk.com/robot/send?access_token=replace-me
      secret: replace-with-the-dingtalk-secret
```

Feishu and DingTalk Webhook Providers are themselves the destination, so the message does not need a recipient. An instant-message `target` must be a complete HTTP(S) URL.

Feishu Webhooks accept HTTPS URLs under `open.feishu.cn` or `open.larksuite.com`; DingTalk Webhooks accept HTTPS URLs under `oapi.dingtalk.com`. Both reject redirects. Providers do not resolve application users into email addresses or phone numbers, and there is no shared content renderer, Provider routing, or cross-Channel fallback; each `messages` entry is the complete message for its Channel.

Feishu and DingTalk Webhook Channel fields:

| Configuration item | Required | Description                                                                                           |
| ------------------ | -------- | ----------------------------------------------------------------------------------------------------- |
| `provider`         | Yes      | Use `feishu-webhook` for Feishu or `dingtalk-webhook` for DingTalk.                                   |
| `webhookUrl`       | Yes      | Bot Webhook URL under the corresponding official HTTPS host.                                          |
| `secret`           | No       | Webhook signing secret. When set, the Provider generates a signature according to the platform rules. |

:::warning Note

Webhook URLs, signing secrets, SMTP passwords, and Resend API keys are credentials. Do not commit them to Git, write them to logs, or include them in error messages. Keep the application's real `config.yml` outside version control and inject secrets at runtime.

:::

## Send notifications from application code

Server code should resolve the shared `notificationServiceToken` from the application container and call `send()`. Do not create a second Notification Manager or call SMTP, Resend, or a Webhook directly from business code.

To connect users’ own mailboxes, synchronize inboxes, or reply to messages, use [Mail](./mail/index.md). Notification emails and user mailboxes have separate configuration and submission records.

`send()` accepts one parameter object:

| Parameter        | Required | Description                                                                                                                                   |
| ---------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `idempotencyKey` | Yes      | Identifies one business send. Reusing it for the same request returns the original Notification and prevents duplicates.                      |
| `source`         | No       | Business source information. `type` is required and `referenceId` is optional; use them to correlate the notification with a business object. |
| `messages`       | Yes      | A map keyed by Channel name with at least one entry. Each key must match an enabled Channel; one call can send to multiple Channels.          |

The fields under each `messages.<channel>` depend on the Channel type. Built-in Channel message fields are:

| Channel type | Required fields                   | Optional fields                         | Description                                                                                                     |
| ------------ | --------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| In-app       | `to`, `title`, `body`             | `target`                                | `to` is an application user ID or an array of IDs; `target` can be an internal route or a complete HTTP(S) URL. |
| Email        | `to`, `subject`, `text` or `html` | `from`, `replyTo`                       | `to` can be one email address or an array; each address creates an independent Delivery.                        |
| Webhook      | `text`                            | `title`, `target`, `format`, `payloads` | Do not set `to` for Webhook messages; `target` must be a complete HTTP(S) URL.                                  |

This example sends an in-app message through the `inbox` Channel:

```ts
import { notificationServiceToken } from '@nocobase/app-plugin-notification/server';

const notification = app.container.resolve(notificationServiceToken);

const result = await notification.send({
  idempotencyKey: `approval:${approval.id}:approved:${approval.version}`,
  source: {
    type: 'approval',
    referenceId: approval.id,
  },
  messages: {
    inbox: {
      to: approval.requesterId,
      title: 'Approval approved',
      body: `Order ${approval.orderNo} was approved.`,
      target: { type: 'route', path: `/orders/${approval.orderId}` },
    },
  },
});
```

Each key in `messages` must match an enabled Channel in `notification.channels`. An in-app `target` can be an internal application route or a complete HTTP(S) URL; omit the deployment prefix from an internal route because NocoBase applies the current application's basename during client navigation.

To send email, use another named Channel:

```ts
await notification.send({
  idempotencyKey: `approval:${approval.id}:approved:email`,
  messages: {
    'system-email': {
      to: approval.requesterEmail,
      subject: 'Approval approved',
      text: `Order ${approval.orderNo} was approved.`,
    },
  },
});
```

An instant message can include an external link through `target`:

```ts
await notification.send({
  idempotencyKey: `deployment:${deployment.id}:feishu`,
  messages: {
    'ops-feishu': {
      text: `Version ${deployment.version} was deployed.`,
      target: {
        type: 'url',
        url: `https://example.com/deployments/${deployment.id}`,
      },
    },
  },
});
```

`idempotencyKey` identifies one business send. Reusing the same key with the same request returns the original Notification instead of creating a duplicate; reusing it with different content raises a conflict. Reuse the key after a queue retry, request timeout, or process recovery.

`send()` usually returns `pending` or `processing`, which only means that the Notification was stored and handed to the queue. A Delivery with `accepted` means that the Provider accepted the submission; it does not prove that the final recipient received or read the message. Keep the Notification ID and inspect its status and Delivery logs.

## Subscribe to status, query results, and retry

`send()` returns the Notification ID, idempotency key, current status, and Delivery list. After the request enters the queue, you can query the result by Notification ID or idempotency key, or subscribe to status changes.

### Subscribe to status changes

Use `onStatusChanged()` to subscribe to one Notification's status changes. The filter must include `notificationId` or `idempotencyKey`. After the subscription succeeds, it receives the current status once and then receives later updates when the status changes. The subscription is valid only in the current service process; after a restart, query or subscribe again.

```ts
const unsubscribe = notification.onStatusChanged(
  { notificationId: result.notificationId },
  (event) => {
    if (event.terminal) {
      console.log(`Notification terminal status: ${event.status}`);
      unsubscribe();
    }
  },
);
```

Call the returned `unsubscribe()` function when you no longer need the subscription. The callback includes the Notification status, summary, and latest status for each Delivery; `terminal` is `true` when no further automatic status changes are expected.

### Query notification results

When you have a Notification ID, call `getNotification()`; when you only have an idempotency key, call `getByIdempotencyKey()`. Both methods return a status snapshot and return `undefined` when no record is found.

```ts
const current = await notification.getNotification(result.notificationId);
const sameNotification = await notification.getByIdempotencyKey(
  result.idempotencyKey,
);

if (current) {
  console.log(current.status, current.deliveries);
}
```

The snapshot includes the overall Notification status, `terminal`, `requiresAction`, counts by status, and each Delivery's Channel, Provider, status, error, attempt count, and `nextRunAt`. When diagnosing a failure, read the Notification and Delivery first, then correlate the result with server logs.

### Retry a failed Delivery

Before retrying, read the Delivery status:

A Delivery has one of these statuses:

| Status       | Meaning                                                                               | Action                                                                     |
| ------------ | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `pending`    | The Delivery is stored and waiting for the queue.                                     | Wait for the queue; do not retry manually.                                 |
| `preparing`  | The message is being prepared.                                                        | Wait for preparation to finish.                                            |
| `submitting` | The message is being submitted to the Provider.                                       | Wait for the Provider result; do not submit again.                         |
| `retrying`   | An automatic retry is scheduled; `nextRunAt` is the earliest execution time.          | Wait for the automatic retry; do not retry manually.                       |
| `accepted`   | The Provider accepted the submission, but delivery to the recipient is not confirmed. | Do not retry; check the Provider or destination if confirmation is needed. |
| `failed`     | The Delivery failed with no automatic retry waiting.                                  | Fix the cause, then retry manually.                                        |
| `unknown`    | The runtime cannot confirm whether the Provider received the request.                 | Check the Provider or destination; do not retry directly.                  |

Manual retry applies only to `failed`. `retryDelivery()` requires a `reason`, records a retry audit, and remains bound to the original Channel and Provider. If the recipient format is unsupported, correct it and create a new Notification instead of modifying the existing Delivery.

```ts
const snapshot = await notification.getNotification(result.notificationId);
const delivery = snapshot?.deliveries.find((item) => item.status === 'failed');

if (delivery) {
  const retried = await notification.retryDelivery({
    deliveryId: delivery.id,
    reason: 'The Provider has recovered; retry this failed Delivery.',
  });
  console.log(retried.status);
}
```

For an `unknown` Delivery, do not call `retryDelivery()` directly. Check the Provider dashboard or destination first; if you confirm that the message was not sent, create a new Notification.

## Test sends and delivery logs

After enabling the notification client plugin, open **Settings → Notifications → Notification logs** to inspect Notifications, Deliveries, and delivery execution records.

The page provides a **Send test notification** action. It loads enabled named Channels and safe test fields; the submission only needs the Channel name and field values, so Provider names and credentials do not go into the browser payload.

- In-app tests require a recipient user ID
- Email tests require a recipient address
- Instant-message tests submit directly to the configured Webhook
- Test sends use the real Notification Manager and create notification logs

The logs page requires `page:notification.logs` `access` permission. Submitting a test also requires `notification:test` `send` permission. A test send is a real external side effect, so confirm the recipient scope before using it in production.

## Read delivery status

The Notification status summarizes its Deliveries:

| Status       | Meaning                                                             |
| ------------ | ------------------------------------------------------------------- |
| `pending`    | The Delivery is stored and waiting for the queue                    |
| `processing` | At least one Delivery is preparing, submitting, or waiting to retry |
| `completed`  | All Deliveries were accepted by their Providers                     |
| `partial`    | Completed Deliveries contain both successes and failures            |
| `failed`     | All Deliveries failed with no automatic retry waiting               |
| `unknown`    | At least one Provider submission result cannot be confirmed         |

A Delivery can show `pending`, `preparing`, `submitting`, `retrying`, `accepted`, `failed`, or `unknown`. `retrying` means that the next automatic retry has been scheduled; `accepted` means that the Provider accepted the submission, not that the final message was delivered; `unknown` means that the message may have been sent and must not be treated as unsent until the Provider or destination is checked.

For a long-lived `pending` or `processing` state, inspect the queue worker, application migrations, and server logs. For `failed`, check the recipient, credentials, Provider configuration, and error category. Inspect each failed Delivery in a `partial` Notification instead of resending every Channel.

For `unknown`, check the Provider dashboard or destination before taking action. If you confirm that the message was not sent, create a new Notification; do not call `retryDelivery()` directly because the submission may already have succeeded.

## Related links

- [5. Send notifications](../tutorials/notifications.md) — configure, send, and diagnose notifications through an approval example
- [Workflow quick start](./workflow/quick-start.md) — connect an application agent to a business workflow
- [Run instruction](./workflow/development/nodes/run.md) — call application services from a workflow
- [Application configuration](../app/configuration.md) — manage `config.yml` and runtime configuration
