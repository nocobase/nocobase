---
pkg: '@nocobase/plugin-feishu'
---

# Notification: Feishu / Lark

## Introduction

The **Feishu / Lark** plugin allows the application to send notification messages to Feishu users.

## Add and configure a Feishu authenticator

First, add and configure a Feishu authenticator on NocoBase, refer to [Authentication: Feishu / Lark](/auth-verification/auth-feishu/). Only system users who have logged in via Feishu can receive system notifications through Feishu.

Messages are sent through the Feishu app of the selected authenticator, which additionally requires:

1. The **Bot** capability enabled under **App Features** on the open platform — sending fails without it;
2. The **Send messages as bot** permission (`im:message:send_as_bot`) enabled under **Permissions**, with a new version published;
3. Receiving users within the app's **contact permission scope** (availability scope).

Publish a new version after changing app capabilities or permissions, then retry.

## Add a Feishu notification channel

Go to **Notification Management** → channels, add a **Feishu / Lark** channel and select the configured authenticator.

Optionally configure the **Receiver ID type** (`open_id`, `user_id`, `union_id` or `email`); it defaults to the authenticator's user unique identifier field.

## Message types

| Type | Description |
| --- | --- |
| Text message | Plain text content. |
| Post message | Rich text in the Feishu post format. |
| Interactive card | A Feishu card configured as JSON. |

Receivers are resolved from the Feishu identity bound to the authenticator (by receiver ID type); unbound users fall back to email or username.

## Workflow notification node

Select the configured Feishu channel in the notification workflow node to send Feishu messages to users in the workflow context.

## Troubleshooting

- Sending fails with a permission error (e.g. code `230002`): check that the **Bot** capability is added and the **Send messages as bot** permission is enabled, and that the latest version is published.
- Sending fails with an invalid receiver (`receive_id` errors): the receiving user is outside the app's contact permission scope, or the receiver ID type does not match the channel configuration.
- The task failure shows only a generic error: check the `FeishuNotificationChannel.send failed` entry in the server logs; newer plugin versions also log the Feishu error code and message.
