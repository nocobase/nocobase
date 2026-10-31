---
pkg: '@nocobase/plugin-feishu'
---

# Authentication: Feishu / Lark

## Introduction

The **Feishu / Lark** plugin allows users to log in to NocoBase using their Feishu or Lark accounts, with optional automatic (silent) login.

## Enable Plugin

Feishu / Lark is a commercial plugin. Install and enable it in the plugin manager, together with the **User Authentication** plugin.

## Create an App on the Open Platform

Go to the [Feishu Open Platform](https://open.feishu.cn/) developer console and create an **Enterprise self-built app** (for Lark, use the [Lark Open Platform](https://open.larksuite.com/)). Note down the **App ID** and **App Secret**.

No extra API permissions are required for login. For contact synchronization, see [Synchronize User Data from Feishu](/users-permissions/sync/sources/feishu).

## Configure the Redirect URL

Under the app's **Security Settings** → **Redirect URLs**, add the callback URL shown by NocoBase:

```
https://your-domain/api/feishu:redirect
```

The easiest way is to copy the **Redirect URL** displayed on the NocoBase authenticator configuration page.

:::warning
When NocoBase is deployed under a sub-path (e.g. `APP_PUBLIC_PATH=/nocobase/`), the callback URL carries the prefix, e.g. `https://your-domain/nocobase/api/feishu:redirect`. The URL in the Feishu allowlist must match the actual URL exactly.
:::

## Add Feishu Authentication in NocoBase

Go to the **User Authentication** page and add a **Feishu / Lark** authenticator:

| Field | Description |
| --- | --- |
| Sign up automatically | Automatically create an account on first login. Enabled by default. |
| Region | `Feishu China` or `Lark Global`. |
| App ID / App Secret | Credentials of the Feishu app. Environment variables and secrets are supported. |
| Origin | Public address of the site, e.g. `https://example.com`. Protocol and domain only, without a path (trailing slash optional); falls back to the current request origin when empty. |
| User unique identifier field | The user identity key, see below. |
| Automatic login | Silent login when the app is opened inside Feishu, see below. |

## Choosing the User Unique Identifier Field

| Field | Description |
| --- | --- |
| `union_id` | Recommended. Stable and shared across all apps under the same developer account. |
| `open_id` | Unique per app; changes when switching apps. |
| `user_id` | Unique within a tenant; may conflict in multi-tenant scenarios. |
| `mobile` / `email` | Mutable and may be empty; not suitable as the identifier. |

Keep this choice stable once users have signed in. If user data synchronization is also used, select the same field in the sync source.

## Login and Automatic Sign-up

Users click the **Feishu / Lark** button on the sign-in page to complete OAuth login. With automatic sign-up enabled:

- Users are matched or created by the **user unique identifier field**;
- Phone, email and nickname are only filled in when the user profile is empty; existing values are never overwritten.

## Automatic Login

With **Automatic Login** enabled, opening the app inside the Feishu client automatically starts OAuth login without clicking the sign-in button. Only one Feishu authenticator can enable automatic login at a time.

Requirements:

- The callback URL is included in the **Redirect URLs** allowlist;
- The app is published and the user is within its availability scope;
- The app is opened inside the Feishu client.

The first use shows a one-time Feishu consent page; subsequent visits are silent. Opening the app in a system browser does not trigger automatic login — this is expected behavior.

## Feishu Workbench Entry (Optional)

Configure the desktop/mobile homepage under **App Features** → **Web App** on the open platform so users can open NocoBase directly from the Feishu workbench. The URL must match the actual NocoBase address (including the sub-path prefix, if any).
