---
pkg: "@nocobase/plugin-logger"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::



# Nhật ký

## Giới thiệu

Nhật ký là một công cụ quan trọng giúp chúng ta xác định các vấn đề của hệ thống. Nhật ký máy chủ của NocoBase chủ yếu bao gồm nhật ký yêu cầu giao diện và nhật ký hoạt động hệ thống, hỗ trợ cấu hình cấp độ nhật ký, chiến lược luân chuyển, kích thước, định dạng in, v.v. Tài liệu này chủ yếu giới thiệu các nội dung liên quan đến nhật ký máy chủ của NocoBase, cũng như cách sử dụng tính năng đóng gói và tải xuống nhật ký máy chủ được cung cấp bởi plugin ghi nhật ký.

## Cấu hình nhật ký

Bạn có thể cấu hình các tham số liên quan đến nhật ký như cấp độ nhật ký, phương thức xuất và định dạng in thông qua [biến môi trường](/get-started/installation/env.md#logger_transport).

## Định dạng nhật ký

NocoBase hỗ trợ cấu hình 4 định dạng nhật ký khác nhau.

### `console`

Định dạng mặc định trong môi trường phát triển, các thông báo được hiển thị với màu sắc nổi bật.

```
2023-12-30 22:40:06 [info]  response                                     method=GET path=/api/uiSchemas:getJsonSchema/nocobase-admin-menu res={"status":200} action={"actionName":"getJsonSchema","resourceName":"uiSchemas","params":{"filterByTk":"nocobase-admin-menu","resourceName":"uiSchemas","resourceIndex":"nocobase-admin-menu","actionName":"getJsonSchema"}} userId=1 status=200 cost=5 app=main reqId=ccf4e3bd-beb0-4350-af6e-b1fc1d9b6c3f
2023-12-30 22:43:12 [debug] Database dialect: mysql                      module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
2023-12-30 22:43:12 [warn]  app is installed                             module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
```

### `json`

Định dạng mặc định trong môi trường sản xuất.

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

## Thư mục nhật ký

Cấu trúc thư mục chính của các tệp nhật ký NocoBase là:

- `storage/logs` - Thư mục xuất nhật ký
  - `main` - Tên ứng dụng chính
    - `request_YYYY-MM-DD.log` - Nhật ký yêu cầu
    - `system_YYYY-MM-DD.log` - Nhật ký hệ thống
    - `system_error_YYYY-MM-DD.log` - Nhật ký lỗi hệ thống
    - `sql_YYYY-MM-DD.log` - Nhật ký thực thi SQL
    - ...
  - `sub-app` - Tên ứng dụng con
    - `request_YYYY-MM-DD.log`
    - ...

## Tệp nhật ký

### Nhật ký yêu cầu

`request_YYYY-MM-DD.log`, nhật ký yêu cầu và phản hồi giao diện.

| Trường          | Mô tả                               |
| ------------- | ---------------------------------- |
| `level`       | Cấp độ nhật ký                           |
| `timestamp`   | Thời gian ghi nhật ký `YYYY-MM-DD hh:mm:ss` |
| `message`     | `request` hoặc `response`            |
| `userId`      | Chỉ có trong `response`                   |
| `method`      | Phương thức yêu cầu                           |
| `path`        | Đường dẫn yêu cầu                         |
| `req` / `res` | Nội dung yêu cầu/phản hồi                      |
| `action`      | Tài nguyên và tham số yêu cầu                     |
| `status`      | Mã trạng thái phản hồi                         |
| `cost`        | Thời gian xử lý yêu cầu                           |
| `app`         | Tên ứng dụng hiện tại                       |
| `reqId`       | ID yêu cầu                            |

:::info{title=Lưu ý}
`reqId` sẽ được gửi đến frontend thông qua tiêu đề phản hồi `X-Request-Id`.
:::

### Nhật ký hệ thống

`system_YYYY-MM-DD.log`, nhật ký hoạt động của ứng dụng, middleware, plugin và các thành phần hệ thống khác. Các nhật ký cấp độ `error` sẽ được ghi riêng vào `system_error_YYYY-MM-DD.log`.

| Trường        | Mô tả                               |
| ----------- | ---------------------------------- |
| `level`     | Cấp độ nhật ký                           |
| `timestamp` | Thời gian ghi nhật ký `YYYY-MM-DD hh:mm:ss` |
| `message`   | Thông báo nhật ký                           |
| `module`    | Module                               |
| `submodule` | Submodule                             |
| `method`    | Phương thức được gọi                           |
| `meta`      | Thông tin liên quan khác, định dạng JSON            |
| `app`       | Tên ứng dụng hiện tại                       |
| `reqId`     | ID yêu cầu                            |

### Nhật ký thực thi SQL

`sql_YYYY-MM-DD.log`, nhật ký thực thi SQL của cơ sở dữ liệu. Các câu lệnh `INSERT INTO` chỉ giữ lại 2000 ký tự đầu tiên.

| Trường        | Mô tả                               |
| ----------- | ---------------------------------- |
| `level`     | Cấp độ nhật ký                           |
| `timestamp` | Thời gian ghi nhật ký `YYYY-MM-DD hh:mm:ss` |
| `sql`       | Câu lệnh SQL                           |
| `app`       | Tên ứng dụng hiện tại                       |
| `reqId`     | ID yêu cầu                            |

## Đóng gói và tải xuống nhật ký

1.  Truy cập trang quản lý nhật ký.
2.  Chọn các tệp nhật ký bạn muốn tải xuống.
3.  Nhấp vào nút Tải xuống (Download).

![2024-04-10_10-50-50](https://static-docs.nocobase.com/2024-04-10_10-50-50.png)

## Tài liệu liên quan

- [Phát triển Plugin - Máy chủ - Ghi nhật ký](/plugin-development/server/logger)
- [Tham khảo API - @nocobase/logger](/api/logger/logger)