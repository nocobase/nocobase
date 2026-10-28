---
pkg: '@nocobase/plugin-feishu'
title: "Synchronize User Data from Feishu"
description: "Synchronize Feishu users and departments to NocoBase and receive incremental changes through HTTP callbacks or Stream mode."
keywords: "Feishu,Lark,user synchronization,department synchronization,Stream mode,event callback,NocoBase"
---

# Synchronize User Data from Feishu

<PluginInfo commercial="true" name="feishu"></PluginInfo>

## Introduction

The **Feishu / Lark** plugin synchronizes users and departments from a Feishu organization to NocoBase. It supports full synchronization on demand and incremental updates through either an HTTP callback or a Stream connection.

## Before you begin

1. Install and enable the **Feishu / Lark** and **User Data Synchronization** plugins.
2. Create an enterprise self-built app on the Feishu Open Platform, see [Authentication: Feishu / Lark](/auth-verification/auth-feishu/).
3. Grant the contact permissions and configure the contact visibility scope described below.

## Contact Permissions and Visibility Scope

In the app's **Permissions**, enable the following permissions:

| Permission | Scope | Required | Purpose |
| --- | --- | --- | --- |
| Obtaining user basic information | `contact:user.base:readonly` | Yes | Reads user names, `open_id` / `union_id` and other basic fields; without it the API returns no names and synchronized nicknames are empty. |
| Obtaining department basic information | `contact:department.base:readonly` | Yes | Reads department names and hierarchy. |
| Obtaining department organizational structure | `contact:department.organize:readonly` | Yes | Traverses child departments; reads department owners. |
| Obtaining user organizational structure | `contact:user.department:readonly` | Yes | Reads the user's departments and main department. |
| Obtaining user user ID | `contact:user.id:readonly` | Required for `user_id` identifier | Reads the `user_id` field. |
| Obtaining user phone number | `contact:user.phone:readonly` | Required to sync phones | Reads phone numbers; required when the identifier is `mobile`. |
| Obtaining user email information | `contact:user.email:readonly` | Required to sync emails | Reads emails; required when the identifier is `email`. |

Then configure the **contact permission scope** (which departments and members the app can access):

1. On the **Development Config → Permissions** page, click **Configure** on the right of the "Accessible data scope" column of a contact permission (enabling a contact permission also redirects here automatically).
2. Select the departments and members the app can access. For the first setup, choosing **All members** is recommended to verify the pipeline, then narrow it down as needed.
3. Click **OK** to save.

:::warning
The contact permission scope and the "app availability scope" (who can use the app) are two independent settings — do not confuse them; only the contact permission scope affects data synchronization. API permissions decide which fields the app can read, while the contact permission scope decides which departments and users — both must be configured. The synchronization scope follows the permission scope; run a full synchronization again after changing it. Event subscription does not replace read permissions: on every event NocoBase still calls the Feishu API to fetch the latest user or department data.
:::

## Add a Feishu Sync Source

Go to **Users & Permissions** → **Sync** and add a source of type **Feishu / Lark**:

| Field | Description |
| --- | --- |
| Source name | Unique name of the sync source. |
| Enabled | Starts event receiving for the source and allows running sync tasks. |
| Region | `Feishu China` or `Lark Global`. |
| App ID / App Secret | Credentials of the Feishu app. Environment variables and secrets are supported. |
| User unique identifier field | `user_id`, `union_id`, `open_id`, `mobile` or `email`; `union_id` recommended. Keep consistent with the authenticator; users missing the selected value are skipped. |
| Event receiving mode | **HTTP callback** or **Stream mode**, see below. |

Save and enable the source, then click **Sync** to perform the first full synchronization.

## Choosing the Event Receiving Mode

### Stream Mode

Stream mode keeps a persistent WebSocket connection initiated by the NocoBase server. No public callback URL, token or encrypt key is required.

1. Select **Stream mode** in NocoBase, save and enable the source.
2. On the open platform under **Events & Callbacks**, switch the receiving mode to **Long connection (WebSocket)** and subscribe to the contact events.

The connection starts automatically when the source is enabled (with automatic reconnection) and is refreshed or closed when the source is updated, disabled or deleted.

:::info
Stream mode requires no public inbound address and no reverse proxy, which suits intranet deployments. Search the application logs for `Feishu stream client` to check the connection status.
:::

### HTTP Callback

HTTP callback mode receives Feishu events at a NocoBase callback URL.

1. Select **HTTP callback** in NocoBase and configure the **Verification Token** and optionally the **Encrypt Key** — at least one is required.
2. Save the source and copy the **Event callback URL** shown in the UI.
3. On the open platform under **Events & Callbacks** → **Event configuration**, set the receiving mode to push events to the server, paste the URL and subscribe to the contact events.

The callback URL must be reachable by Feishu (HTTPS in production). With an Encrypt Key configured, callback payloads are encrypted.

:::warning
Without a Verification Token or Encrypt Key, callback requests are rejected (401). After a source is switched to Stream mode, the HTTP callback endpoint is closed (403).
:::

## Supported Incremental Events

Both modes support the following Feishu contact events:

| Event | Handling in NocoBase |
| --- | --- |
| `contact.user.created_v3` | Create or update the user. |
| `contact.user.updated_v3` | Update the user. |
| `contact.user.deleted_v3` | Delete the synchronized user. |
| `contact.department.created_v3` | Create or update the department. |
| `contact.department.updated_v3` | Update the department. |
| `contact.department.deleted_v3` | Delete the synchronized department. |

Users with the Root role are never deleted by synchronization.

## Synchronized Fields

### Department fields

| Feishu field | NocoBase field / purpose |
| --- | --- |
| `open_department_id` | Unique source identifier of the department. |
| `name` | Department name. |
| `parent_department_id` | Parent department, used to build the hierarchy. Departments whose parent is out of scope are synced as roots. |

### User fields

| Feishu field | NocoBase field / purpose |
| --- | --- |
| Identifier field value | Source identifier and username, generated from the **user unique identifier field**. |
| `name`, falls back to `en_name` | Nickname; left empty when both are missing. |
| `mobile` | Phone number. |
| `email` | Email. |
| `department_ids` | Departments of the user; only those within the visibility scope. |
| `main_department_id` | Main department. |

### Department Owners

Department owners (leaders) from the department data are synchronized as department owners in NocoBase: a user can own multiple departments, and an owned department is not necessarily the user's main department. Only departments within the visibility scope participate. Owners removed on the Feishu side are removed on the next synchronization; manually changed owners in NocoBase may be overwritten by the next synchronization.

Other Feishu user fields such as avatar, job title and employee number are not synchronized currently.

## Troubleshooting

- Empty sync results or missing departments: check the contact permissions and whether the department is within the contact permission scope (see above for configuration).
- Empty nicknames: enable **Obtaining user basic information** (`contact:user.base:readonly`) and run a full synchronization again.
- Users skipped: check whether the user has a value for the configured identifier field and whether it matches the authenticator's choice.
- HTTP callback returns 401: no Verification Token or Encrypt Key configured, or token verification failed; 403: the source has been switched to Stream mode.
- `redirect_uri` or callback URL errors: make sure the URL configured on the open platform matches the one shown in NocoBase exactly, including any sub-path prefix (`APP_PUBLIC_PATH`).
- Sync task fails with a Feishu API rate limit error: wait until the limit is lifted and run the synchronization again manually.
