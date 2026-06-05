---
pkg: '@nocobase/plugin-audit-logger'
---

# Audit Logger

## Introduction

The audit log is used to record and track user activities and resource operation history within the system.


![](https://static-docs.nocobase.com/202501031627719.png)



![](https://static-docs.nocobase.com/202501031627922.png)


## Parameter Description

| Parameter             | Description                                                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Resource**          | The target resource type of the operation                                                                                                 |
| **Action**            | The type of operation performed                                                                                                           |
| **User**              | The user performing the operation                                                                                                         |
| **Role**              | The role of the user during the operation                                                                                                 |
| **Data source**       | The data source                                                                                                                           |
| **Target collection** | The target collection                                                                                                                     |
| **Target record UK**  | The unique identifier of the target collection                                                                                            |
| **Source collection** | The source collection of the association field                                                                                            |
| **Source record UK**  | The unique identifier of the source collection                                                                                            |
| **Status**            | The HTTP status code of the operation request response                                                                                    |
| **Created at**        | The time of the operation                                                                                                                 |
| **UUID**              | The unique identifier of the operation, consistent with the Request ID of the operation request, can be used to retrieve application logs |
| **IP**                | The IP address of the user                                                                                                                |
| **UA**                | The UA information of the user                                                                                                            |
| **Metadata**          | Metadata such as parameters, request body, and response content of the operation request                                                  |

## Audit Resource Description

Currently, the following resource operations will be recorded in the audit log:

### Main Application

| Operation        | Description             |
| ---------------- | ----------------------- |
| `app:resart`     | Application restart     |
| `app:clearCache` | Clear application cache |

### Plugin Manager

| Operation    | Description    |
| ------------ | -------------- |
| `pm:add`     | Add plugin     |
| `pm:update`  | Update plugin  |
| `pm:enable`  | Enable plugin  |
| `pm:disable` | Disable plugin |
| `pm:remove`  | Remove plugin  |

### User Authentication

| Operation             | Description     |
| --------------------- | --------------- |
| `auth:signIn`         | Sign in         |
| `auth:signUp`         | Sign up         |
| `auth:signOut`        | Sign out        |
| `auth:changePassword` | Change password |

### User

| Operation             | Description    |
| --------------------- | -------------- |
| `users:updateProfile` | Update profile |

### UI Configuration

| Operation                  | Description      |
| -------------------------- | ---------------- |
| `uiSchemas:insertAdjacent` | Insert UI Schema |
| `uiSchemas:patch`          | Modify UI Schema |
| `uiSchemas:remove`         | Remove UI Schema |

### Collection Operations

| Operation        | Description                       |
| ---------------- | --------------------------------- |
| `create`         | Create record                     |
| `update`         | Update record                     |
| `destroy`        | Delete record                     |
| `updateOrCreate` | Update or create record           |
| `firstOrCreate`  | Query or create record            |
| `move`           | Move record                       |
| `set`            | Set association field record      |
| `add`            | Add association field record      |
| `remove`         | Remove association field record   |
| `export`         | Export record                     |
| `import`         | Import record                     |

## Adding Other Audit Resources

If you have extended other resource operations through plugins and wish to record these resource operation behaviors in the audit log, please refer to [API](/api/server/audit-manager.md).