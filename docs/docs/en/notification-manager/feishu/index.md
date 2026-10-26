---
pkg: '@nocobase/plugin-feishu'
---

# Notification: Feishu / Lark

## Introduction

The **Feishu / Lark** plugin allows the application to send notification messages to Feishu users.

## Add and configure a Feishu authenticator

First, add and configure a Feishu authenticator on NocoBase, refer to [Authentication: Feishu / Lark](/auth-verification/auth-feishu/). Only system users who have logged in via Feishu can receive system notifications through Feishu.

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
