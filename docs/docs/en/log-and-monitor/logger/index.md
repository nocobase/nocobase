---
pkg: '@nocobase/plugin-logger'
---

# Logging

## Introduction

Logs are an important tool for us to locate system issues. NocoBase's server logs mainly include interface request logs and system operation logs, supporting configuration of log level, rolling strategy, size, printing format, and more. This document mainly introduces the related content of NocoBase server logs, as well as how to use the logging plugin to package and download server logs.

## Log Configuration

Log-related parameters such as log level, output method, and printing format can be configured through [environment variables](/get-started/installation/env.md#logger_transport).

## Log Formats

NocoBase supports configuring four different log formats.

### `console`

The default format in development environment, messages are highlighted in color.

```
2023-12-30 22:40:06 [info]  response                                     method=GET path=/api/uiSchemas:getJsonSchema/nocobase-admin-menu res={"status":200} action={"actionName":"getJsonSchema","resourceName":"uiSchemas","params":{"filterByTk":"nocobase-admin-menu","resourceName":"uiSchemas","resourceIndex":"nocobase-admin-menu","actionName":"getJsonSchema"}} userId=1 status=200 cost=5 app=main reqId=ccf4e3bd-beb0-4350-af6e-b1fc1d9b6c3f
2023-12-30 22:43:12 [debug] Database dialect: mysql                      module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
2023-12-30 22:43:12 [warn]  app is installed                             module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
```

### `json`

The default format in production environment.

```json
{
  "level": "info",
  "timestamp": "2023-12-26 22:04:56",
  "reqId": "7612ef42-58e8-4c35-bac2-2e6c9d8ec96e",
  "message": "response",
  "method": "POST",
  "path": "/api/authenticators:publicList",
  "res": { "status": 200 },
  "action": {
    "actionName": "publicList",
    "resourceName": "authenticators",
    "params": { "resourceName": "authenticators", "actionName": "publicList" }
  },
  "status": 200,
  "cost": 16
}
```

### `logfmt`

> https://brandur.org/logfmt.

```
level=info timestamp=2023-12-21 14:18:02 reqId=8b59a40d-68ee-4c97-8001-71a47a92805a
message=response method=POST path=/api/authenticators:publicList res={"status":200}
action={"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}
userId=undefined status=200 cost=14
```

### `delimiter`

Separated by delimiter `|`.

```
info|2023-12-26 22:07:09|13cd16f0-1568-418d-ac37-6771ee650e14|response|POST|/api/authenticators:publicList|{"status":200}|{"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}||200|25
```

## Log Directory

The main directory structure of NocoBase log files is:

- `storage/logs` - Log output directory
  - `main` - Main application name
    - `request_YYYY-MM-DD.log` - Request log
    - `system_YYYY-MM-DD.log` - System log
    - `system_error_YYYY-MM-DD.log` - System error log
    - `sql_YYYY-MM-DD.log` - SQL execution log
    - ...
  - `sub-app` - Sub-application name
    - `request_YYYY-MM-DD.log`
    - ...

## Log Files

### Request Log

`request_YYYY-MM-DD.log`, interface request and response logs.

| Field         | Description                          |
| ------------- | ------------------------------------ |
| `level`       | Log level                            |
| `timestamp`   | Log print time `YYYY-MM-DD hh:mm:ss` |
| `message`     | `request` or `response`              |
| `userId`      | Only in `response`                   |
| `method`      | Request method                       |
| `path`        | Request path                         |
| `req` / `res` | Request/Response content             |
| `action`      | Requested resources and parameters   |
| `status`      | Response status code                 |
| `cost`        | Request duration                     |
| `app`         | Current application name             |
| `reqId`       | Request ID                           |

:::info{title=Note}
`reqId` will be carried to the front end via the `X-Request-Id` response header.
:::

### System Log

`system_YYYY-MM-DD.log`, application, middleware, plugins, and other system operation logs, `error` level logs will be printed separately to `system_error_YYYY-MM-DD.log`.

| Field       | Description                            |
| ----------- | -------------------------------------- |
| `level`     | Log level                              |
| `timestamp` | Log print time `YYYY-MM-DD hh:mm:ss`   |
| `message`   | Log message                            |
| `module`    | Module                                 |
| `submodule` | Submodule                              |
| `method`    | Called method                          |
| `meta`      | Other related information, JSON format |
| `app`       | Current application name               |
| `reqId`     | Request ID                             |

### SQL Execution Log

`sql_YYYY-MM-DD.log`, database SQL execution logs. `INSERT INTO` statements are limited to the first 2000 characters.

| Field       | Description                          |
| ----------- | ------------------------------------ |
| `level`     | Log level                            |
| `timestamp` | Log print time `YYYY-MM-DD hh:mm:ss` |
| `sql`       | SQL statement                        |
| `app`       | Current application name             |
| `reqId`     | Request ID                           |

## Log Packaging and Downloading

1. Navigate to the log management page.
2. Select the log files you wish to download.
3. Click the Download button.


![2024-04-10_10-50-50](https://static-docs.nocobase.com/2024-04-10_10-50-50.png)


## Related Documents

- [Plugin Development - Server - Logging](/plugin-development/server/logger)
- [API Reference - @nocobase/logger](/api/logger/logger)