---
pkg: '@nocobase/plugin-logger'
title: "Log Server NocoBase"
description: "Log server NocoBase: log request, log hệ thống, log SQL, các định dạng console/json/logfmt/delimiter, cấu trúc thư mục storage/logs, đóng gói tải log."
keywords: "log server,log request,log hệ thống,log SQL,định dạng log,logfmt,đóng gói log,NocoBase"
---
# Log

## Giới thiệu

Log là phương tiện quan trọng giúp chúng ta định vị các vấn đề hệ thống. Log server của NocoBase chủ yếu bao gồm log request interface và log vận hành hệ thống, hỗ trợ cấu hình mức log, chiến lược rolling, kích thước, định dạng in, v.v. Tài liệu này chủ yếu giới thiệu nội dung liên quan đến log server NocoBase và cách sử dụng tính năng đóng gói và tải log server do plugin log cung cấp.

## Cấu hình log

Có thể cấu hình các tham số liên quan đến log như mức log, phương thức output, định dạng in thông qua [biến môi trường](/get-started/installation/env.md#logger_transport).

## Định dạng log

NocoBase hỗ trợ cấu hình 4 định dạng log khác nhau.

### `console`

Định dạng mặc định cho môi trường phát triển, tin nhắn được hiển thị với màu sắc nổi bật.

```
2023-12-30 22:40:06 [info]  response                                     method=GET path=/api/uiSchemas:getJsonSchema/nocobase-admin-menu res={"status":200} action={"actionName":"getJsonSchema","resourceName":"uiSchemas","params":{"filterByTk":"nocobase-admin-menu","resourceName":"uiSchemas","resourceIndex":"nocobase-admin-menu","actionName":"getJsonSchema"}} userId=1 status=200 cost=5 app=main reqId=ccf4e3bd-beb0-4350-af6e-b1fc1d9b6c3f
2023-12-30 22:43:12 [debug] Database dialect: mysql                      module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
2023-12-30 22:43:12 [warn]  app is installed                             module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
```

### `json`

Định dạng mặc định cho môi trường production.

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

Phân tách bằng dấu phân cách `|`.

```
info|2023-12-26 22:07:09|13cd16f0-1568-418d-ac37-6771ee650e14|response|POST|/api/authenticators:publicList|{"status":200}|{"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}||200|25
```

## Thư mục log

Cấu trúc thư mục chính của file log NocoBase:

- `storage/logs` - thư mục output log
  - `main` - tên ứng dụng chính
    - `request_YYYY-MM-DD.log` - log request
    - `system_YYYY-MM-DD.log` - log hệ thống
    - `system_error_YYYY-MM-DD.log` - log lỗi hệ thống
    - `sql_YYYY-MM-DD.log` - log thực thi SQL
    - ...
  - `sub-app` - tên ứng dụng con
    - `request_YYYY-MM-DD.log`
    - ...

## File log

### Log request

`request_YYYY-MM-DD.log`, log request và response interface.

| Field          | Mô tả                               |
| ------------- | ---------------------------------- |
| `level`       | Mức log                           |
| `timestamp`   | Thời gian in log `YYYY-MM-DD hh:mm:ss` |
| `message`     | `request` hoặc `response`            |
| `userId`      | Chỉ có trong `response`                  |
| `method`      | Phương thức request                           |
| `path`        | Đường dẫn request                           |
| `req` / `res` | Nội dung request/response                      |
| `action`      | Resource và tham số request                     |
| `status`      | Status code response                         |
| `cost`        | Thời gian request                           |
| `app`         | Tên ứng dụng hiện tại                       |
| `reqId`       | Request ID                            |

:::info{title=Mẹo}
`reqId` sẽ được mang theo header response `X-Request-Id` đến frontend.
:::

### Log hệ thống

`system_YYYY-MM-DD.log`, log vận hành hệ thống của ứng dụng, middleware, plugin, v.v. Log mức `error` sẽ được in riêng vào `system_error_YYYY-MM-DD.log`

| Field        | Mô tả                               |
| ----------- | ---------------------------------- |
| `level`     | Mức log                           |
| `timestamp` | Thời gian in log `YYYY-MM-DD hh:mm:ss` |
| `message`   | Tin nhắn log                           |
| `module`    | Module                               |
| `submodule` | Sub-module                             |
| `method`    | Phương thức gọi                           |
| `meta`      | Các thông tin liên quan khác, định dạng JSON            |
| `app`       | Tên ứng dụng hiện tại                       |
| `reqId`     | Request ID                            |

### Log thực thi SQL

`sql_YYYY-MM-DD.log`, log thực thi SQL của database. Trong đó câu lệnh `INSERT INTO` chỉ giữ lại 2000 ký tự đầu tiên.

| Field        | Mô tả                               |
| ----------- | ---------------------------------- |
| `level`     | Mức log                           |
| `timestamp` | Thời gian in log `YYYY-MM-DD hh:mm:ss` |
| `sql`       | Câu lệnh SQL                           |
| `app`       | Tên ứng dụng hiện tại                       |
| `reqId`     | Request ID                            |

## Đóng gói tải log

<PluginInfo name="logger"></PluginInfo>

1. Vào trang Quản lý log.
2. Chọn file log muốn tải.
3. Click nút Tải (Download).

![2024-04-10_10-50-50](https://static-docs.nocobase.com/2024-04-10_10-50-50.png)

## Tài liệu liên quan

- [Phát triển plugin - Server - Log](/plugin-development/server/logger)
- [Tài liệu API - @nocobase/logger](/api/logger/logger)
