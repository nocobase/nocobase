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
3. Grant the contact permissions and configure the data permission scope described below.
4. Copy the application's Client ID and Client Secret. See [Authentication: DingTalk](/auth-verification/auth-dingtalk/) for the credential setup.

## Configure contact permissions and the data permission scope

Open **Permission Management** for the application in the DingTalk developer console and grant the following contact permissions.

| Permission | Identifier | Required | Purpose |
| --- | --- | --- | --- |
| Read department information | `qyapi_get_department_list` | Yes | Read the department list, names, and hierarchy. |
| Read department members | `qyapi_get_department_member` | Yes | Read the member list of each department. |
| Read member information | `qyapi_get_member` | Yes | Read member details and department memberships. |
| Employee mobile number information | `fieldMobile` | When using mobile numbers | Synchronize mobile numbers. This permission is required when **User unique identifier field** is `mobile`. |
| Email and other personal information | `fieldEmail` | No | Grant this permission when user email addresses need to be synchronized. |

After granting the permissions, configure the application's **Data Permission Scope** (also called **Contact Permission Scope** or **Visibility Range** in some console versions) to include the departments and employees that may be synchronized. Select all employees for a full organization synchronization. If only selected departments or employees are included, NocoBase synchronizes only those entries.

:::warning
API permissions determine which fields the application can read, while the data permission scope determines which departments and employees it can read. Both must be configured. Event subscriptions do not replace contact read permissions: after receiving an event, NocoBase still calls DingTalk APIs to retrieve the latest user or department information.
:::

If the same DingTalk application is also used for sign-in, grant the personal-information permissions described in [Authentication: DingTalk](/auth-verification/auth-dingtalk/). Those sign-in permissions are not required solely for user data synchronization.

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

## Synchronized fields

### Department fields

| DingTalk field | NocoBase field or purpose |
| --- | --- |
| `dept_id` | Source-unique department identifier. |
| `name` | Department name. |
| `parent_id` | Parent department used to build the department hierarchy. If the parent is outside the data permission scope, the department is synchronized as a root department. |

### User fields

| DingTalk field | NocoBase field or purpose |
| --- | --- |
| `mobile` or `unionid` | Generates the source-unique user identifier and username according to **User unique identifier field**. A user without the selected field is skipped. |
| `name` | User nickname. |
| `mobile` | Phone number. Requires the **Employee mobile number information** permission. |
| `email`, falling back to `org_email` | Email address. Requires the **Email and other personal information** permission. |
| `dept_id_list` | Department memberships. Only departments within the data permission scope are retained. |
| `dept_order_list` | Primary department. |
| `leader_in_dept` | Whether the user is an owner of the corresponding department. |

### Department owners

DingTalk uses `leader_in_dept` in the user details to indicate whether the user is an owner of each department they belong to. NocoBase synchronizes this flag separately for each department: the same user can own multiple departments, and an owned department does not have to be the user's primary department. Only departments within the data permission scope are included.

When an owner flag is removed in DingTalk, the corresponding owner flag in NocoBase is removed by the next synchronization. Owner status changed manually in NocoBase may be overwritten by DingTalk data during the next synchronization.

Full and incremental synchronization use the same field mapping. Other DingTalk user fields, such as avatar, job title, and employee number, are not currently synchronized.

## Troubleshooting

- If synchronization returns no data or an entire department is missing, verify the three required contact read permissions and confirm that the department is included in the data permission scope.
- If a user is present but their mobile number or email address is empty, verify the **Employee mobile number information** or **Email and other personal information** permission respectively.
- If DingTalk reports that a department or employee is outside the permission scope, expand the application's data permission scope instead of only resubscribing to events.
- If users are skipped, verify that they have a value for the configured unique identifier field.
- For Stream mode, check the application logs for `Dingtalk stream client starting`, `Dingtalk stream client started`, or connection errors.
- For HTTP callback mode, verify that the callback URL is publicly reachable and that Token and EncodingAESKey match the DingTalk configuration.
- Run a manual full synchronization after changing the application's permissions or visibility range.
