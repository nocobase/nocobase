---
pkg: '@nocobase/plugin-auth-dingtalk'
---

# Notification: DingTalk

## Overview

The **DingTalk** plugin registers a notification channel type `dingtalk` that sends **work notifications** via DingTalk Open Platform.

## Prerequisites

1. Install and enable `@nocobase/plugin-auth-dingtalk` and the **notification manager** plugin.
2. Configure a DingTalk authenticator (Client ID / Secret) and set **Agent ID** on the authenticator (required for `asyncsend_v2`).
3. End users must sign in with DingTalk so `usersAuthenticators` contains a binding. The authenticator currently supports `openId`, `unionId`, or `mobile` as the unique identifier; before sending, the server will try to resolve the selected identifier to the **userid** required by DingTalk APIs.

## Channel configuration

![](https://static-docs.nocobase.com/20260513232350.png)

Create a channel in Notification manager, type **DingTalk**, and select the authenticator to use.

## Message templates

![](https://static-docs.nocobase.com/20260513232435.png)

- **Text template** — `text` work notification for plain text messages, configured with `text.content`.
- **Markdown template** — `markdown` work notification (text / images / links per DingTalk client).
- **ActionCard template** — `action_card` with **whole-card jump** (single URL) or **independent buttons** (`btn_json_list` JSON array).
- **Form template (OA)** — `oa` for structured summaries (e.g. orders), optional `form` key-value JSON rows, plus `message_url` / `pc_message_url`.
