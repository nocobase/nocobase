---
pkg: '@nocobase/plugin-logger'
---

# 日志

## 介绍

日志是帮助我们定位系统问题的重要手段。NocoBase 的服务端日志主要包括接口请求日志和系统运行日志，支持日志级别、滚动策略、大小、打印格式等配置。本篇文档主要介绍 NocoBase 服务端日志的相关内容，以及如何使用日志插件提供的服务端日志打包和下载的功能。

## 日志配置

可以通过 [环境变量](/get-started/installation/env.md#logger_transport) 配置日志级别、输出方式、打印格式等的日志相关参数。

## 日志格式

NocoBase 支持配置4种不同的日志格式。

### `console`

开发环境默认格式，消息以高亮颜色显示。

```
2023-12-30 22:40:06 [info]  response                                     method=GET path=/api/uiSchemas:getJsonSchema/nocobase-admin-menu res={"status":200} action={"actionName":"getJsonSchema","resourceName":"uiSchemas","params":{"filterByTk":"nocobase-admin-menu","resourceName":"uiSchemas","resourceIndex":"nocobase-admin-menu","actionName":"getJsonSchema"}} userId=1 status=200 cost=5 app=main reqId=ccf4e3bd-beb0-4350-af6e-b1fc1d9b6c3f
2023-12-30 22:43:12 [debug] Database dialect: mysql                      module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
2023-12-30 22:43:12 [warn]  app is installed                             module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
```

### `json`

生产环境默认格式。

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

分隔符 `|` 分割。

```
info|2023-12-26 22:07:09|13cd16f0-1568-418d-ac37-6771ee650e14|response|POST|/api/authenticators:publicList|{"status":200}|{"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}||200|25
```

## 日志目录

NocoBase 日志文件的主要目录结构为：

- `storage/logs` - 日志输出目录
  - `main` - 主应用名称
    - `request_YYYY-MM-DD.log` - 请求日志
    - `system_YYYY-MM-DD.log` - 系统日志
    - `system_error_YYYY-MM-DD.log` - 系统错误日志
    - `sql_YYYY-MM-DD.log` - SQL 执行日志
    - ...
  - `sub-app` - 子应用名称
    - `request_YYYY-MM-DD.log`
    - ...

## 日志文件

### 请求日志

`request_YYYY-MM-DD.log`, 接口请求和响应日志。

| 字段          | 说明                               |
| ------------- | ---------------------------------- |
| `level`       | 日志级别                           |
| `timestamp`   | 日志打印时间 `YYYY-MM-DD hh:mm:ss` |
| `message`     | `request` 或 `response`            |
| `userId`      | `response` 中才有                  |
| `method`      | 请求方法                           |
| `path`        | 请求路径                           |
| `req` / `res` | 请求/响应内容                      |
| `action`      | 请求资源和参数                     |
| `status`      | 响应状态码                         |
| `cost`        | 请求耗时                           |
| `app`         | 当前应用名称                       |
| `reqId`       | 请求 ID                            |

:::info{title=提示}
`reqId` 会通过 `X-Request-Id` 响应头携带给前端。
:::

### 系统日志

`system_YYYY-MM-DD.log`, 应用、中间件、插件等系统运行日志，`error` 级别日志会单独打印到 `system_error_YYYY-MM-DD.log`

| 字段        | 说明                               |
| ----------- | ---------------------------------- |
| `level`     | 日志级别                           |
| `timestamp` | 日志打印时间 `YYYY-MM-DD hh:mm:ss` |
| `message`   | 日志消息                           |
| `module`    | 模块                               |
| `submodule` | 子模块                             |
| `method`    | 调用方法                           |
| `meta`      | 其他相关信息, JSON 格式            |
| `app`       | 当前应用名称                       |
| `reqId`     | 请求 ID                            |

### SQL 执行日志

`sql_YYYY-MM-DD.log`, 数据库 SQL 执行日志。其中 `INSERT INTO` 语句仅保留前 2000 个字符。

| 字段        | 说明                               |
| ----------- | ---------------------------------- |
| `level`     | 日志级别                           |
| `timestamp` | 日志打印时间 `YYYY-MM-DD hh:mm:ss` |
| `sql`       | SQL 语句                           |
| `app`       | 当前应用名称                       |
| `reqId`     | 请求 ID                            |

## 日志打包下载

<PluginInfo name="logger"></PluginInfo>

1. 进入日志管理页面。
2. 选择想要下载的日志文件。
3. 点击下载 (Download) 按钮。

![2024-04-10_10-50-50](https://static-docs.nocobase.com/2024-04-10_10-50-50.png)

## 相关文档

- [插件开发 - 服务端 - 日志](/plugin-development/server/logger)
- [API参考 - @nocobase/logger](/api/logger/logger)
