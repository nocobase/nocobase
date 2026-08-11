---
pkg: '@nocobase/plugin-auth-dingtalk'
title: "Synchronize User Data from DingTalk"
description: "Synchronize DingTalk users and departments to NocoBase and receive incremental changes through HTTP callbacks or Stream mode."
keywords: "DingTalk,user synchronization,department synchronization,Stream mode,event subscription,NocoBase"
---

# Synchronize User Data from DingTalk

<PluginInfo commercial="true" name="auth-dingtalk"></PluginInfo>

## Introduction

The **DingTalk** plugin synchronizes users and departments from a DingTalk organization to NocoBase. It supports full synchronization on demand and incremental updates through either an HTTP callback or a Stream connection.

## Before you begin

1. Install and enable the **DingTalk** and **User Data Synchronization** plugins.
2. Create an internal application in the DingTalk developer console.
3. Grant the application permission to read the required contacts and configure its visibility range. Only authorized departments and users can be synchronized.
4. Copy the application's Client ID and Client Secret. See [Authentication: DingTalk](/auth-verification/auth-dingtalk/) for the credential setup.

## Add a DingTalk synchronization source

Go to **Users & Permissions > Synchronize**, click **Add new**, and select **DingTalk** as the type.

Configure the following fields:

| Field | Description |
| --- | --- |
| Source name | A unique name for this synchronization source. |
| Enabled | Starts event reception for this source and enables synchronization tasks. |
| Client ID | The Client ID of the DingTalk internal application. Environment variables and secrets are supported. |
| Client Secret | The Client Secret of the DingTalk internal application. Environment variables and secrets are supported. |
| User unique identifier field | Select `mobile` or `unionId`. Keep the selected field stable after the first synchronization. Users without a value for the selected field are skipped. |
| Event receiving mode | Select **HTTP callback** or **Stream mode** for incremental user and department changes. |

Save and enable the source, then click **Sync** to complete the initial full synchronization before relying on incremental events.

## Choose an event receiving mode

### Stream mode

Stream mode establishes an outbound persistent connection from the NocoBase server to DingTalk. It does not require a public callback URL, Token, or EncodingAESKey.

1. In the DingTalk developer console, open the application's event subscription settings and select **Stream mode**.
2. Subscribe to the user and department change events required by the application.
3. In NocoBase, select **Stream mode**, save the source, and enable it.

The Stream client starts when the source is enabled. Updating, disabling, or deleting the source refreshes or closes the corresponding connection.

:::info
The NocoBase server must be able to establish outbound connections to DingTalk. A reverse proxy or public inbound callback endpoint is not required for Stream mode.
:::

### HTTP callback

HTTP callback mode receives DingTalk events through a NocoBase callback URL.

1. Select **HTTP callback** in NocoBase.
2. Enter the Token and EncodingAESKey configured for the DingTalk event subscription.
3. Save the source and copy the generated **Event callback URL**.
4. Configure that URL in the DingTalk developer console and subscribe to the required user and department events.

The callback URL must be reachable by DingTalk. In a production environment, expose it through HTTPS and make sure the reverse proxy forwards the request path unchanged.

## Supported incremental events

Both event receiving modes handle the following DingTalk events:

| Event | Result in NocoBase |
| --- | --- |
| `user_add_org` | Create or update the user. |
| `user_modify_org` | Update the user. |
| `user_leave_org` | Delete the synchronized user. |
| `org_dept_create` | Create or update the department. |
| `org_dept_modify` | Update the department and synchronize its users. |
| `org_dept_remove` | Delete the synchronized department. |

## Troubleshooting

- If users or departments are missing, verify the application's contacts permissions and visibility range in DingTalk.
- If users are skipped, verify that they have a value for the configured unique identifier field.
- For Stream mode, check the application logs for `Dingtalk stream client starting`, `Dingtalk stream client started`, or connection errors.
- For HTTP callback mode, verify that the callback URL is publicly reachable and that Token and EncodingAESKey match the DingTalk configuration.
- Run a manual full synchronization after changing the application's permissions or visibility range.
